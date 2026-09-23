import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const normalizeText = (value: unknown, maxLength: number) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const getSafeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';

  if (/out of stock|insufficient inventory/i.test(message)) {
    return { status: 409, message: 'Selected product is out of stock.' };
  }
  if (/variant is invalid|variant before checkout/i.test(message)) {
    return { status: 400, message: 'A selected product option is no longer available.' };
  }
  if (/unavailable for this address|postal|pin code|country/i.test(message)) {
    return { status: 400, message: 'Cash on Delivery is unavailable for this address.' };
  }
  if (/unavailable|valid cart|invalid item|invalid quantity/i.test(message)) {
    return { status: 400, message: 'One or more cart items are no longer available.' };
  }
  if (/shipping address|phone/i.test(message)) {
    return { status: 400, message: message || 'Please check your shipping address.' };
  }

  return { status: 500, message: 'Unable to place your order. Please try again.' };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ') || authHeader.length <= 'Bearer '.length) {
    return jsonResponse({ error: 'Session expired. Please sign in again.' }, 401);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Service is not configured');
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 100_000) {
      return jsonResponse({ error: 'Request is too large.' }, 413);
    }

    const token = authHeader.slice('Bearer '.length);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Session expired. Please sign in again.' }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid request body.' }, 400);
    }

    const rawItems = payload?.items;
    const rawAddress = payload?.shippingAddress;
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_CART_ITEMS) {
      return jsonResponse({ error: 'A valid cart is required.' }, 400);
    }
    if (!rawAddress || typeof rawAddress !== 'object' || Array.isArray(rawAddress)) {
      return jsonResponse({ error: 'A shipping address is required.' }, 400);
    }

    const address = rawAddress as Record<string, unknown>;
    const country = normalizeText(address.country, 80);
    if (country.toLowerCase() !== 'india') {
      return jsonResponse({ error: 'Cash on Delivery is unavailable for this address.' }, 400);
    }

    const shippingAddress = {
      first_name: normalizeText(address.first_name, 80),
      last_name: normalizeText(address.last_name, 80),
      street: normalizeText(address.street, 180),
      address_line_2: normalizeText(address.address_line_2, 180),
      city: normalizeText(address.city, 100),
      state: normalizeText(address.state, 100),
      postal_code: normalizeText(address.postal_code, 6),
      country: 'India',
      email: normalizeText(address.email || user.email, 254).toLowerCase(),
      phone: normalizeText(address.phone || profile?.phone, 30).replace(/\D/g, ''),
    };

    const requiredAddressFields = ['first_name', 'last_name', 'street', 'city', 'state', 'postal_code', 'phone'];
    if (requiredAddressFields.some((field) => !shippingAddress[field as keyof typeof shippingAddress])) {
      return jsonResponse({ error: 'The shipping address is incomplete.' }, 400);
    }
    if (!/^\d{6}$/.test(shippingAddress.postal_code)) {
      return jsonResponse({ error: 'Cash on Delivery is unavailable for this address.' }, 400);
    }
    if (!/^(?:91)?[6-9]\d{9}$/.test(shippingAddress.phone)) {
      return jsonResponse({ error: 'Please provide a valid Indian phone number.' }, 400);
    }

    const combinedItems = new Map<string, { product_id: string; variant_id: string | null; quantity: number }>();
    for (const rawItem of rawItems) {
      const item = rawItem && typeof rawItem === 'object' ? rawItem as Record<string, unknown> : {};
      const productId = normalizeText(item.product_id, 36);
      const variantId = item.variant_id ? normalizeText(item.variant_id, 36) : null;
      const quantity = Number(item.quantity);

      if (!UUID_PATTERN.test(productId)
        || (variantId && !UUID_PATTERN.test(variantId))
        || !Number.isInteger(quantity)
        || quantity < 1
        || quantity > MAX_ITEM_QUANTITY) {
        return jsonResponse({ error: 'The cart contains an invalid item.' }, 400);
      }

      const key = `${productId}:${variantId || 'no-variant'}`;
      const combinedQuantity = (combinedItems.get(key)?.quantity || 0) + quantity;
      if (combinedQuantity > MAX_ITEM_QUANTITY) {
        return jsonResponse({ error: 'Item quantity exceeds the allowed limit.' }, 400);
      }
      combinedItems.set(key, { product_id: productId, variant_id: variantId, quantity: combinedQuantity });
    }

    const items = [...combinedItems.values()];
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, status, stock')
      .in('id', productIds);
    if (productsError) throw productsError;

    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, stock')
      .in('product_id', productIds);
    if (variantsError) throw variantsError;

    const productMap = new Map((products || []).map((product) => [product.id, product]));
    const variantMap = new Map((variants || []).map((variant) => [variant.id, variant]));
    const productsWithVariants = new Set((variants || []).map((variant) => variant.product_id));

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product || product.status !== 'active' || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
        return jsonResponse({ error: 'One or more cart items are no longer available.' }, 400);
      }

      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id);
        if (!variant || variant.product_id !== item.product_id) {
          return jsonResponse({ error: 'A selected product option is no longer available.' }, 400);
        }
        if (Number(variant.stock) < item.quantity) {
          return jsonResponse({ error: 'Selected product is out of stock.' }, 409);
        }
      } else if (productsWithVariants.has(item.product_id)) {
        return jsonResponse({ error: 'Please select a product option before checkout.' }, 400);
      } else if (Number(product.stock) < item.quantity) {
        return jsonResponse({ error: 'Selected product is out of stock.' }, 409);
      }
    }

    const { data: createdOrders, error: createError } = await supabase.rpc('create_cod_order_atomic', {
      p_user_id: user.id,
      p_shipping_address: shippingAddress,
      p_items: items,
    });
    if (createError) throw new Error(createError.message);

    const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
    if (!createdOrder?.order_id || !createdOrder?.order_number) {
      throw new Error('Order creation returned an incomplete response');
    }

    return jsonResponse({
      orderId: createdOrder.order_id,
      orderNumber: createdOrder.order_number,
      total: Number(createdOrder.total),
      paymentMethod: 'cod',
    });
  } catch (error) {
    console.error('Error in create-cod-order:', error);
    const safeError = getSafeError(error);
    return jsonResponse({ error: safeError.message }, safeError.status);
  }
});
