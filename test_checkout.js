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
  if (!products.length) {
    console.log("Product not found, searching with ilike");
    const res2 = await fetch(`${url}/rest/v1/products?select=id,name&name=ilike.*CHALK*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    console.log(await res2.json());
    return;
  }
  const product = products[0];
  console.log("Product ID:", product.id);

  console.log("2. Fetching variant Size: XS, Color: Black");
  const resVar = await fetch(`${url}/rest/v1/product_variants?select=id,size,color,stock&product_id=eq.${product.id}&size=eq.XS&color=eq.Black`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const variants = await resVar.json();
  if (!variants.length) {
    console.log("Variant not found!");
    return;
  }
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

  console.log("3. Payload for Checkout:", JSON.stringify(payload, null, 2));

  console.log("4. Calling create-razorpay-order Edge Function...");
  const resEdge = await fetch(`${url}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload)
  });

  console.log("Edge Function Response Status:", resEdge.status);
  const data = await resEdge.json();
  console.log("Edge Function Response Data:", data);

  if (resEdge.ok && data.orderId) {
    console.log("5. Checking orders table for orderId:", data.orderId);
    const resOrd = await fetch(`${url}/rest/v1/orders?select=*&id=eq.${data.orderId}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    console.log("Order from DB:", await resOrd.json());

    console.log("6. Checking order_items table for variant_id");
    const resItem = await fetch(`${url}/rest/v1/order_items?select=*&order_id=eq.${data.orderId}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    console.log("Order items from DB:", await resItem.json());
  }
}

run();
