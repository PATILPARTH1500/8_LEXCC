import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const signaturesMatch = (body: string, receivedSignature: string, secret: string) => {
  const expected = createHmac('sha256', secret).update(body).digest();
  let received: Uint8Array;

  try {
    received = Uint8Array.from(Buffer.from(receivedSignature, 'hex'));
  } catch {
    return false;
  }

  return expected.length === received.length && timingSafeEqual(expected, received);
};

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let eventId = '';
  let supabaseClient: SupabaseClient<any> | null = null;

  try {
    const signature = req.headers.get('x-razorpay-signature') || '';
    eventId = req.headers.get('x-razorpay-event-id') || '';
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!signature || !eventId) return jsonResponse({ error: 'Missing Razorpay webhook headers' }, 400);
    if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Webhook service is not configured');
    }

    const rawBody = await req.text();
    if (!signaturesMatch(rawBody, signature, webhookSecret)) {
      return jsonResponse({ error: 'Invalid webhook signature' }, 400);
    }

    const event = JSON.parse(rawBody);
    if (!event?.event || typeof event.event !== 'string') {
      return jsonResponse({ error: 'Invalid webhook event' }, 400);
    }

    supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: claimed, error: claimError } = await supabaseClient.rpc('claim_razorpay_webhook_event', {
      p_event_id: eventId,
      p_event_type: event.event
    });

    if (claimError) throw claimError;
    if (!claimed) return jsonResponse({ received: true, duplicate: true });

    if (event.event === 'payment.captured' || event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      if (!payment?.id || !payment?.order_id) throw new Error('Webhook payment data is incomplete');

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('id, order_number, total_amount, created_at, shipping_address, user_id')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (orderError || !order) throw new Error(`Order not found for Razorpay order ${payment.order_id}`);

      if (event.event === 'payment.captured') {
        const expectedAmount = Math.round(Number(order.total_amount) * 100);
        if (payment.status !== 'captured' || payment.currency !== 'INR' || payment.amount !== expectedAmount) {
          throw new Error('Captured payment details do not match the order');
        }

        const { error: finalizeError } = await supabaseClient.rpc('finalize_razorpay_payment', {
          p_order_id: order.id,
          p_payment_id: payment.id,
          p_signature: null
        });
        if (finalizeError) throw finalizeError;

        // The client verification endpoint may have finalized first. Webhook event
        // deduplication still makes this notification block run once per captured event.
        const { data: items, error: itemsError } = await supabaseClient
          .from('order_items')
          .select('quantity, products(name)')
          .eq('order_id', order.id);
        if (itemsError) throw itemsError;

        let customerEmail = payment.email || order.shipping_address?.email || '';
        let customerName = [order.shipping_address?.first_name, order.shipping_address?.last_name]
          .filter(Boolean)
          .join(' ') || 'Customer';

        if (order.user_id) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', order.user_id)
            .maybeSingle();

          if (profile) {
            customerEmail = profile.email || customerEmail;
            customerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || customerName;
          }
        }

        if (customerEmail) {
          const formattedAddress = Object.values(order.shipping_address || {}).filter(Boolean).join(', ');
          const { error: emailError } = await supabaseClient.functions.invoke('send-transactional-email', {
            body: {
              type: 'order_confirmed',
              order: order.order_number,
              customerName,
              email: customerEmail,
              totalAmount: order.total_amount,
              shippingAddress: formattedAddress,
              orderDate: order.created_at,
              items: (items || []).map((item) => ({
                name: (Array.isArray(item.products) ? item.products[0] : item.products)?.name,
                quantity: item.quantity
              }))
            }
          });

          if (emailError) console.error('Order confirmation email failed:', emailError);
        }
      } else {
        const { error: failedUpdateError } = await supabaseClient
          .from('orders')
          .update({ payment_status: 'failed', razorpay_payment_id: payment.id })
          .eq('id', order.id)
          .eq('payment_status', 'pending');

        if (failedUpdateError) throw failedUpdateError;
      }
    } else if (event.event === 'refund.processed') {
      const refund = event.payload?.refund?.entity;
      if (!refund?.id || !refund?.payment_id) throw new Error('Webhook refund data is incomplete');

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('id, total_amount')
        .eq('razorpay_payment_id', refund.payment_id)
        .single();
      if (orderError || !order) throw new Error(`Order not found for payment ${refund.payment_id}`);

      const expectedAmount = Math.round(Number(order.total_amount) * 100);
      const payment = event.payload?.payment?.entity;
      const cumulativeRefundedAmount = Number(payment?.amount_refunded || 0);
      const isFullRefund = Number(refund.amount) === expectedAmount
        || cumulativeRefundedAmount >= expectedAmount;

      // Do not restore all inventory for a partial refund. A later event whose
      // cumulative refunded amount reaches the order total will finalize once.
      if (isFullRefund) {
        const { error: refundError } = await supabaseClient.rpc('finalize_razorpay_refund', {
          p_order_id: order.id,
          p_refund_id: refund.id
        });
        if (refundError) throw refundError;
      }
    }

    const { error: eventUpdateError } = await supabaseClient
      .from('razorpay_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString(), error_message: null })
      .eq('event_id', eventId);
    if (eventUpdateError) throw eventUpdateError;

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);

    if (supabaseClient && eventId) {
      await supabaseClient
        .from('razorpay_webhook_events')
        .update({
          status: 'failed',
          error_message: (error instanceof Error ? error.message : 'Webhook processing failed').slice(0, 1000)
        })
        .eq('event_id', eventId);
    }

    return jsonResponse({ error: error instanceof Error ? error.message : 'Webhook processing failed' }, 500);
  }
});
