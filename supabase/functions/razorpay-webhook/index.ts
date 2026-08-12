import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import crypto from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return new Response('No signature provided', { status: 400 });
    }

    const body = await req.text();
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    // Verify webhook signature manually in Deno
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body)
                                    .digest('hex');

    if (expectedSignature !== signature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let paymentId;
    let rzpOrderId;

    if (event.event === 'payment.captured' || event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      paymentId = paymentEntity.id;
      rzpOrderId = paymentEntity.order_id;
      
      const { data: orderData, error: orderLookupErr } = await supabaseClient
        .from('orders')
        .select(`
          id, 
          order_number, 
          total_amount, 
          created_at, 
          shipping_address, 
          user_id
        `)
        .eq('razorpay_order_id', rzpOrderId)
        .single();
        
      if (orderLookupErr || !orderData) {
        throw new Error(`Order not found for razorpay_order_id: ${rzpOrderId}`);
      }
      
      if (event.event === 'payment.captured') {
        // Update order status
        await supabaseClient
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            razorpay_payment_id: paymentId
          })
          .eq('id', orderData.id);
          
        // Deduct inventory
        const { data: items } = await supabaseClient
          .from('order_items')
          .select(`
            variant_id, 
            quantity,
            products ( name )
          `)
          .eq('order_id', orderData.id);
          
        if (items) {
          for (const item of items) {
            if (item.variant_id) {
              await supabaseClient.rpc('deduct_variant_stock', {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity
              });
            }
          }
        }

        // Fetch user profile for email
        let customerEmail = paymentEntity.email || '';
        let customerName = 'Customer';
        
        if (orderData.user_id) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', orderData.user_id)
            .single();
            
          if (profile) {
            customerEmail = profile.email || customerEmail;
            customerName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Customer';
          }
        }

        // Map items for email
        const emailItems = items ? items.map(i => ({
          name: i.products?.name,
          quantity: i.quantity
        })) : [];

        // Try to invoke transactional email (fail silently to avoid breaking webhook)
        if (customerEmail) {
          try {
            const formattedAddress = typeof orderData.shipping_address === 'object' && orderData.shipping_address !== null
              ? Object.values(orderData.shipping_address).filter(Boolean).join(', ')
              : 'Address on file';

            supabaseClient.functions.invoke('send-transactional-email', {
              body: {
                type: 'order_confirmed',
                order: orderData.order_number,
                customerName,
                email: customerEmail,
                totalAmount: orderData.total_amount,
                shippingAddress: formattedAddress,
                orderDate: orderData.created_at,
                items: emailItems
              }
            }).catch(e => console.error('Failed to trigger confirmation email:', e));
          } catch (e) {
            console.error('Failed to prepare confirmation email logic:', e);
          }
        }
      } else if (event.event === 'payment.failed') {
        await supabaseClient
          .from('orders')
          .update({
            payment_status: 'failed',
            razorpay_payment_id: paymentId
          })
          .eq('id', orderData.id);
      }
    } else if (event.event === 'refund.processed') {
      const refundEntity = event.payload.refund.entity;
      paymentId = refundEntity.payment_id;
      
      const { data: orderData } = await supabaseClient
        .from('orders')
        .select('id')
        .eq('razorpay_payment_id', paymentId)
        .single();
        
      if (orderData) {
        await supabaseClient
          .from('orders')
          .update({
            payment_status: 'refunded',
            status: 'cancelled'
          })
          .eq('id', orderData.id);
          
        // Restore inventory
        const { data: items } = await supabaseClient
          .from('order_items')
          .select('variant_id, quantity')
          .eq('order_id', orderData.id);
          
        if (items) {
          for (const item of items) {
            if (item.variant_id) {
              await supabaseClient.rpc('restore_variant_stock', {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    });
  }
});
