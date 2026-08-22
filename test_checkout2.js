import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
const url = urlMatch[1];
const key = keyMatch[1];

async function run() {
  console.log("1. Fetching product CHALK ESSENTIAL TEE");
  const res1 = await fetch(`${url}/rest/v1/products?select=id,name&name=eq.CHALK%20ESSENTIAL%20TEE`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const products = await res1.json();
  const product = products[0];

  console.log("2. Fetching variant Size: XS, Color: Black");
  const resVar = await fetch(`${url}/rest/v1/product_variants?select=id,size,color,stock&product_id=eq.${product.id}&size=eq.XS&color=eq.Black`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const variants = await resVar.json();
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
  // Use anon key in headers, but NOT as Bearer for Auth if we want to be guest? 
  // Wait, if it starts with Bearer, it assumes user token. Let's just omit Authorization header?
  // Edge functions require anon key in Authorization if they are protected, but wait, supabase-js uses it. Let's omit Authorization and see, or pass anon as anon.
  // Actually, wait, supabase-js sends Authorization: Bearer <session_token> OR anon_key.
  // Wait! If the anon key is sent, `getUser` will fail?
  // Let me check create-razorpay-order edge function logic again.
  const resEdge = await fetch(`${url}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // omitting Auth might return 401 if it requires it, but let's try. Wait, edge functions need Authorization header to even execute unless invoked with anon key.
  });
}
run();
