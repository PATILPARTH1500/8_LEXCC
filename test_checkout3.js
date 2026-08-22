import fs from 'fs';
import WebSocket from 'ws';
global.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
const url = urlMatch[1];
const key = keyMatch[1];

const supabase = createClient(url, key);

async function run() {
  console.log("1. Fetching product CHALK ESSENTIAL TEE");
  const { data: products } = await supabase.from('products').select('id,name').eq('name', 'CHALK ESSENTIAL TEE');
  const product = products[0];

  console.log("2. Fetching variant Size: XS, Color: Black");
  const { data: variants } = await supabase.from('product_variants').select('id,size,color,stock').eq('product_id', product.id).eq('size', 'XS').eq('color', 'Black');
  const variant = variants[0];
  console.log("Variant ID:", variant.id, "Stock:", variant.stock);

  const payload = {
    items: [{
      product_id: product.id,
      variant_id: variant.id,
      size: variant.size,
      color: variant.color,
      quantity: 1
    }],
    shippingAddress: {
      first_name: "Test",
      last_name: "User",
      street: "123 Main St",
      city: "Test City",
      state: "Test State",
      postal_code: "123456",
      country: "India",
      email: "test@example.com",
      phone: "9876543210"
    }
  };

  console.log("3. Calling create-razorpay-order Edge Function...");
  // We can just omit the Authorization header for guest checkout by calling the REST API directly
  // Wait, invoke sends anon key!
  // Oh, wait, the user said "create-razorpay-order -> 200". Let's invoke it via supabase client!
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: payload
  });
  
  if (error) {
    console.error("Error from function:", error);
    // Let's try again with a raw fetch omitting Authorization to avoid the anon key bug if there is one
    const res = await fetch(`${url}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Fallback raw fetch status:", res.status);
    console.log("Fallback raw fetch data:", await res.json());
    return;
  }
  console.log("Edge Function Response Data:", data);

  if (data?.orderId) {
    console.log("5. Checking orders table for orderId:", data.orderId);
    const { data: order } = await supabase.from('orders').select('*').eq('id', data.orderId).single();
    console.log("Order from DB:", order);

    console.log("6. Checking order_items table for variant_id");
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', data.orderId);
    console.log("Order items from DB:", items);
  }
}

run();
