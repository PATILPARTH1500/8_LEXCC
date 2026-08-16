import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Invoice service is not configured');

    const payload = await req.json();
    const orderId = typeof payload?.orderId === 'string' ? payload.orderId.trim() : '';
    const guestAccessToken = typeof payload?.guestAccessToken === 'string' ? payload.guestAccessToken.trim() : '';
    if (!UUID_PATTERN.test(orderId)) return jsonResponse({ error: 'Invalid order ID' }, 400);

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        total_amount,
        shipping_address,
        status,
        payment_status,
        razorpay_payment_id,
        created_at,
        guest_access_token_hash,
        user:profiles(first_name, last_name, email),
        items:order_items(
          quantity,
          price_at_time,
          product:products(name),
          variant:product_variants(size, color)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) return jsonResponse({ error: 'Order not found' }, 404);

    let authorized = false;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
        authHeader.slice('Bearer '.length)
      );

      if (!authError && user) {
        if (user.id === order.user_id) {
          authorized = true;
        } else {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();
          authorized = profile?.is_admin === true;
        }
      }
    }

    if (!authorized && !order.user_id && guestAccessToken && order.guest_access_token_hash) {
      authorized = secureEqual(await sha256(guestAccessToken), order.guest_access_token_hash);
    }

    if (!authorized) return jsonResponse({ error: 'Order access denied' }, 403);
    if (order.payment_status !== 'paid') {
      return jsonResponse({ error: 'An invoice is available after payment verification' }, 409);
    }

    const { guest_access_token_hash: _tokenHash, ...safeOrder } = order;
    return jsonResponse({ order: safeOrder });
  } catch (error) {
    console.error('Error in get-order-invoice:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to load invoice' }, 400);
  }
});
