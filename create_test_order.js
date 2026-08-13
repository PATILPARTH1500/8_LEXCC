import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import WebSocket from 'ws';

// Read .env
const envConfig = fs.readFileSync('.env', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    acc[key.trim()] = val.join('=').trim().replace(/(^"|"$)/g, '');
    return acc;
  }, {});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function createTestOrder() {
  console.log('Creating test user and order...');
  
  // 1. Create a dummy user
  const email = `lexcc.dummy.test${Math.floor(Math.random() * 1000)}@gmail.com`;
  const password = 'TestPassword123!';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: 'Dummy',
        last_name: 'Customer'
      }
    }
  });

  if (authError) {
    console.error('Failed to create test user:', authError);
    return;
  }
  
  const user = authData.user;
  console.log(`Created test user: ${email} (${user.id})`);

  // Wait for profile trigger if any
  await new Promise(r => setTimeout(r, 2000));

  // 2. Get a random product
  const { data: products } = await supabase.from('products').select('*, product_variants(*)').limit(1);
  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }
  const product = products[0];
  const variant = product.product_variants && product.product_variants.length > 0 ? product.product_variants[0] : null;
  
  // 3. Create order
  const orderNumber = `LEX-TEST-${Math.floor(Math.random() * 10000)}`;
  const totalAmount = product.price * 1;
  
  const { data: order, error: orderErr } = await supabase.from('orders').insert([{
    user_id: user.id,
    order_number: orderNumber,
    total_amount: totalAmount,
    shipping_address: {
      first_name: 'Dummy',
      last_name: 'Customer',
      street: '123 Fake Street',
      city: 'Mumbai',
      state: 'MH',
      postal_code: '400001',
      country: 'India',
      phone: '9876543210'
    },
    status: 'pending',
    payment_status: 'paid',
    razorpay_order_id: 'order_test_123',
    razorpay_payment_id: 'pay_test_123'
  }]).select().single();
  
  if (orderErr) {
    console.error('Order creation failed:', orderErr);
    return;
  }
  
  // 4. Create order item
  const { error: itemErr } = await supabase.from('order_items').insert([{
    order_id: order.id,
    product_id: product.id,
    variant_id: variant ? variant.id : null,
    quantity: 1,
    price_at_time: product.price
  }]);
  
  if (itemErr) {
    console.error('Order item creation failed:', itemErr);
    return;
  }
  
  console.log(`Successfully created TEST ORDER: ${orderNumber}`);
  console.log(`Order ID: ${order.id}`);
  console.log('--------------------------------------------------');
  console.log('You can now log in to the application using:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('To view this dummy order in your customer dashboard.');
  console.log('Admin accounts will also see this order in the Admin Panel.');
}

createTestOrder();
