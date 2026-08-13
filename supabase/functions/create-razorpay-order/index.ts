import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Razorpay from "https://esm.sh/razorpay@2.9.4?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { items, shippingAddress } = await req.json();

    // Try to extract user if token provided
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }
    
    let totalAmount = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      // Validate Product
      const { data: product, error: prodErr } = await supabaseClient
        .from('products')
        .select('price')
        .eq('id', item.product_id)
        .single();
        
      if (prodErr || !product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      // Validate Variant and stock
      if (item.variant_id) {
         const { data: variant, error: varErr } = await supabaseClient
           .from('product_variants')
           .select('stock')
           .eq('id', item.variant_id)
           .single();
           
         if (varErr || !variant || variant.stock < item.quantity) {
           throw new Error(`Insufficient stock for variant: ${item.variant_id}`);
         }
      }
      
      const price = parseFloat(product.price);
      totalAmount += price * item.quantity;

      orderItemsData.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_time: price
      });
    }

    const orderNumber = `LEX-${Math.floor(Math.random() * 1000000)}`;

    // Create Order in DB
    const { data: order, error: orderErr } = await supabaseClient
      .from('orders')
      .insert([{
        user_id: userId,
        order_number: orderNumber,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending'
      }])
      .select('id')
      .single();

    if (orderErr) throw orderErr;

    // Create Order Items
    for (const oi of orderItemsData) {
      oi.order_id = order.id;
    }

    const { error: itemsErr } = await supabaseClient.from('order_items').insert(orderItemsData);
    if (itemsErr) throw itemsErr;

    // Create Razorpay Order
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')
    });

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // convert to paise
      currency: "INR",
      receipt: orderNumber
    });

    // Update order with razorpay_order_id
    await supabaseClient
      .from('orders')
      .update({ razorpay_order_id: rpOrder.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        razorpayOrderId: rpOrder.id,
        orderNumber: orderNumber,
        orderId: order.id,
        amount: Math.round(totalAmount * 100)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-razorpay-order:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
