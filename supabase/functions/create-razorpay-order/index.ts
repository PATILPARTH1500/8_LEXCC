import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const normalizeText = (value: unknown, maxLength: number) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const bytesToHex = (bytes: Uint8Array) => (
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
);

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
};

const createGuestToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
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
      throw new Error('Payment service is not configured');
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 100_000) return jsonResponse({ error: 'Request is too large' }, 413);

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let userId: string | null = null;
    let authenticatedEmail = '';
    let authenticatedPhone = '';
    const authHeader = req.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) return jsonResponse({ error: 'Invalid authentication token' }, 401);

      userId = user.id;
      authenticatedEmail = user.email || '';

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      authenticatedPhone = profile?.phone || '';
    }

    const payload = await req.json();
    const rawItems = payload?.items;
    const rawAddress = payload?.shippingAddress;

    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_CART_ITEMS) {
      return jsonResponse({ error: 'A valid cart is required' }, 400);
    }
    if (!rawAddress || typeof rawAddress !== 'object' || Array.isArray(rawAddress)) {
      return jsonResponse({ error: 'A shipping address is required' }, 400);
    }

    const shippingAddress = {
      first_name: normalizeText(rawAddress.first_name, 80),
      last_name: normalizeText(rawAddress.last_name, 80),
      street: normalizeText(rawAddress.street, 180),
      city: normalizeText(rawAddress.city, 100),
      state: normalizeText(rawAddress.state, 100),
      postal_code: normalizeText(rawAddress.postal_code, 20),
      country: normalizeText(rawAddress.country, 80),
      email: normalizeText(rawAddress.email || authenticatedEmail, 254).toLowerCase(),
      phone: normalizeText(rawAddress.phone || authenticatedPhone, 30)
    };

    const requiredAddressFields = ['first_name', 'last_name', 'street', 'city', 'state', 'postal_code', 'country'];
    if (requiredAddressFields.some((field) => !shippingAddress[field as keyof typeof shippingAddress])) {
      return jsonResponse({ error: 'The shipping address is incomplete' }, 400);
    }

    if (!userId) {
      if (!EMAIL_PATTERN.test(shippingAddress.email) || shippingAddress.phone.length < 7) {
        return jsonResponse({ error: 'Guest email and phone number are required' }, 400);
      }
    }

    const combinedItems = new Map<string, {
      product_id: string;
      variant_id: string | null;
      size: string;
      color: string;
      quantity: number;
    }>();

    for (const rawItem of rawItems) {
      const productId = normalizeText(rawItem?.product_id, 36);
      const variantId = rawItem?.variant_id ? normalizeText(rawItem.variant_id, 36) : null;
      const quantity = Number(rawItem?.quantity);

      if (!UUID_PATTERN.test(productId)
          || (variantId && !UUID_PATTERN.test(variantId))
          || !Number.isInteger(quantity)
          || quantity < 1
          || quantity > MAX_ITEM_QUANTITY) {
        return jsonResponse({ error: 'The cart contains an invalid item' }, 400);
      }

      const key = `${productId}:${variantId || normalizeText(rawItem?.size, 50)}:${normalizeText(rawItem?.color, 50)}`;
      const existing = combinedItems.get(key);
      const combinedQuantity = (existing?.quantity || 0) + quantity;
      if (combinedQuantity > MAX_ITEM_QUANTITY) {
        return jsonResponse({ error: 'Item quantity exceeds the allowed limit' }, 400);
      }

      combinedItems.set(key, {
        product_id: productId,
        variant_id: variantId,
        size: normalizeText(rawItem?.size, 50),
        color: normalizeText(rawItem?.color, 50),
        quantity: combinedQuantity
      });
    }

    let totalAmount = 0;
    const orderItemsData: Array<{
      product_id: string;
      variant_id: string | null;
      quantity: number;
      price_at_time: number;
    }> = [];

    for (const item of combinedItems.values()) {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('price, status')
        .eq('id', item.product_id)
        .eq('status', 'active')
        .single();

      if (productError || !product) throw new Error(`Product is unavailable: ${item.product_id}`);

      let resolvedVariantId = item.variant_id;
      if (resolvedVariantId) {
        const { data: variant, error: variantError } = await supabaseClient
          .from('product_variants')
          .select('id, product_id, stock')
          .eq('id', resolvedVariantId)
          .eq('product_id', item.product_id)
          .single();

        if (variantError || !variant) throw new Error('The selected product variant is invalid');
        if (variant.stock < item.quantity) throw new Error('The selected product variant is out of stock');
      } else {
        const { data: variants, error: variantsError } = await supabaseClient
          .from('product_variants')
          .select('id, size, color, stock')
          .eq('product_id', item.product_id);

        if (variantsError) throw variantsError;
        const matchingVariants = (variants || []).filter((variant) => (
          (!item.size || variant.size === item.size)
          && (!item.color || variant.color === item.color)
        ));

        if (matchingVariants.length === 1) {
          if (matchingVariants[0].stock < item.quantity) throw new Error('The selected product variant is out of stock');
          resolvedVariantId = matchingVariants[0].id;
        } else if ((variants || []).length > 0) {
          throw new Error('Please select a product size and color before checkout');
        }
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price <= 0) throw new Error('Product price is invalid');

      totalAmount += price * item.quantity;
      orderItemsData.push({
        product_id: item.product_id,
        variant_id: resolvedVariantId,
        quantity: item.quantity,
        price_at_time: price
      });
    }

    const amountInPaise = Math.round(totalAmount * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
      return jsonResponse({ error: 'Order amount is invalid' }, 400);
    }

    const orderNumber = `LEX-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    // Create the Razorpay order first so a provider failure cannot leave a payable DB order.
    const providerResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber
      })
    });
    if (!providerResponse.ok) throw new Error('Unable to initialize payment with Razorpay');

    const razorpayOrder = await providerResponse.json();
    if (!razorpayOrder?.id || razorpayOrder.amount !== amountInPaise || razorpayOrder.currency !== 'INR') {
      throw new Error('Razorpay returned an invalid order response');
    }

    const guestAccessToken = userId ? null : createGuestToken();
    const guestAccessTokenHash = guestAccessToken ? await sha256(guestAccessToken) : null;

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
        user_id: userId,
        order_number: orderNumber,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending',
        razorpay_order_id: razorpayOrder.id,
        guest_access_token_hash: guestAccessTokenHash
      }])
      .select('id')
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsData.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      await supabaseClient.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    return jsonResponse({
      razorpayOrderId: razorpayOrder.id,
      orderNumber,
      orderId: order.id,
      amount: amountInPaise,
      guestAccessToken
    });
  } catch (error) {
    console.error('Error in create-razorpay-order:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unable to create order' }, 400);
  }
});
