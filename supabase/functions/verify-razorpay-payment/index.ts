import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RAZORPAY_ID_PATTERN = /^[A-Za-z0-9_-]{6,100}$/;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/i;

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const bytesToHex = (bytes: Uint8Array) => (
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
);

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
};

const hmacSha256 = async (secret: string, value: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToHex(new Uint8Array(signature));
};

const secureEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Payment verification is not configured');
    }

    const payload = await req.json();
    const orderId = typeof payload?.orderId === 'string' ? payload.orderId.trim() : '';
    const paymentId = typeof payload?.razorpay_payment_id === 'string' ? payload.razorpay_payment_id.trim() : '';
    const callbackOrderId = typeof payload?.razorpay_order_id === 'string' ? payload.razorpay_order_id.trim() : '';
    const signature = typeof payload?.razorpay_signature === 'string' ? payload.razorpay_signature.trim() : '';
    const guestAccessToken = typeof payload?.guestAccessToken === 'string' ? payload.guestAccessToken.trim() : '';

    if (!UUID_PATTERN.test(orderId)
        || !RAZORPAY_ID_PATTERN.test(paymentId)
        || !RAZORPAY_ID_PATTERN.test(callbackOrderId)
        || !SIGNATURE_PATTERN.test(signature)) {
      return jsonResponse({ error: 'Invalid payment verification payload' }, 400);
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, user_id, order_number, total_amount, razorpay_order_id, razorpay_payment_id, payment_status, guest_access_token_hash')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return jsonResponse({ error: 'Order not found' }, 404);
    if (!order.razorpay_order_id || order.razorpay_order_id !== callbackOrderId) {
      return jsonResponse({ error: 'Payment order does not match' }, 400);
    }

    if (order.user_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) return jsonResponse({ error: 'Authentication is required' }, 401);

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
        authHeader.slice('Bearer '.length)
      );
      if (authError || !user || user.id !== order.user_id) return jsonResponse({ error: 'Order access denied' }, 403);
    } else {
      if (!guestAccessToken || !order.guest_access_token_hash) return jsonResponse({ error: 'Guest order token is required' }, 401);
      const providedHash = await sha256(guestAccessToken);
      if (!secureEqual(providedHash, order.guest_access_token_hash)) {
        return jsonResponse({ error: 'Guest order token is invalid' }, 403);
      }
    }

    const expectedSignature = await hmacSha256(
      razorpayKeySecret,
      `${order.razorpay_order_id}|${paymentId}`
    );
    if (!secureEqual(expectedSignature, signature.toLowerCase())) {
      return jsonResponse({ error: 'Payment signature verification failed' }, 400);
    }

    // Confirm provider state as captured before any database fulfillment occurs.
    const providerResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
      }
    });

    if (!providerResponse.ok) throw new Error('Unable to confirm payment status with Razorpay');
    const providerPayment = await providerResponse.json();
    const expectedAmount = Math.round(Number(order.total_amount) * 100);

    if (providerPayment.order_id !== order.razorpay_order_id
        || providerPayment.status !== 'captured'
        || providerPayment.currency !== 'INR'
        || providerPayment.amount !== expectedAmount) {
      return jsonResponse({ error: 'Payment has not been captured for this order' }, 409);
    }

    const { error: finalizeError } = await supabaseClient.rpc('finalize_razorpay_payment', {
      p_order_id: order.id,
      p_payment_id: paymentId,
      p_signature: signature
    });

    if (finalizeError) throw finalizeError;

    return jsonResponse({
      verified: true,
      orderId: order.id,
      orderNumber: order.order_number
    });
  } catch (error) {
    console.error('Error in verify-razorpay-payment:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to verify payment' }, 400);
  }
});
