import WebSocket from 'ws';
global.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';

// Load credentials from environment variables — never hardcode secrets.
// Run with: SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> node test_supabase.js
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set as environment variables.');
  process.exit(1);
}

console.log('STEP 1 — VERIFY ACTIVE SUPABASE PROJECT');
console.log('URL:', url);

const supabase = createClient(url, key);

async function runAudit() {
  try {
    const testEmail = `audit_${Date.now()}@gmail.com`;
    console.log('\nSTEP 2 — VERIFY AUTH USER CREATION');
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Password123!',
      options: {
        data: {
          first_name: 'Audit',
          last_name: 'Test',
          phone: '1234567890'
        }
      }
    });

    if (authErr) {
      console.log('Auth Error:', authErr.message);
      if (authErr.status === 429) {
        console.log('RATE LIMIT HIT. Cannot proceed with full E2E auth flow.');
        return;
      }
      throw authErr;
    }

    const user = authData.user;
    console.log('User created:', user?.id, user?.email);
    
    // Wait for trigger to fire
    await new Promise(r => setTimeout(r, 2000));

    console.log('\nSTEP 3 — VERIFY PROFILE CREATION');
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profErr) {
      console.log('Profile Query Error:', profErr.message);
    } else {
      console.log('Profile exists:', !!profile);
      console.log('Profile Data:', profile);
    }

    console.log('\nSTEP 6 — VERIFY RLS (Profiles)');
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ first_name: 'AuditUpdated' })
      .eq('id', user.id);
    console.log('Profile Update Error:', updErr ? updErr.message : 'None');

    console.log('\nSTEP 7 — VERIFY ADDRESS CRUD');
    const { data: addr, error: addrErr } = await supabase
      .from('addresses')
      .insert([{
        user_id: user.id,
        title: 'HOME',
        first_name: 'Audit',
        last_name: 'Test',
        street: '123 Test St',
        city: 'Testville',
        state: 'TS',
        postal_code: '12345',
        country: 'United States'
      }])
      .select()
      .single();
    
    if (addrErr) {
      console.log('Address Insert Error:', addrErr.message);
    } else {
      console.log('Address Inserted:', addr.id);
      
      const { error: addrUpdErr } = await supabase
        .from('addresses')
        .update({ city: 'UpdatedCity' })
        .eq('id', addr.id);
      console.log('Address Update Error:', addrUpdErr ? addrUpdErr.message : 'None');

      const { error: addrDelErr } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addr.id);
      console.log('Address Delete Error:', addrDelErr ? addrDelErr.message : 'None');
    }

    console.log('\nSTEP 9 — VERIFY WISHLIST');
    // Need a valid product ID for foreign key constraint, fetch one
    const { data: products } = await supabase.from('products').select('id').limit(1);
    if (products && products.length > 0) {
      const prodId = products[0].id;
      const { data: wl, error: wlErr } = await supabase
        .from('wishlist')
        .insert([{ user_id: user.id, product_id: prodId }])
        .select()
        .single();
      
      if (wlErr) {
        console.log('Wishlist Insert Error:', wlErr.message);
      } else {
        console.log('Wishlist Inserted:', wl.id);
        const { error: wlDelErr } = await supabase.from('wishlist').delete().eq('id', wl.id);
        console.log('Wishlist Delete Error:', wlDelErr ? wlDelErr.message : 'None');
      }
    } else {
      console.log('No products found to test wishlist.');
    }

    console.log('\nSTEP 10 — VERIFY ORDERS');
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        order_number: 'AUDIT-' + Date.now(),
        total_amount: 100.00,
        status: 'pending',
        shipping_address: { city: 'Test' }
      }])
      .select()
      .single();
      
    console.log('Order Insert Error:', orderErr ? orderErr.message : 'None, Order ID: ' + (order ? order.id : ''));

    console.log('\nSTEP 11 — VERIFY STORAGE');
    // create dummy text file to test upload
    const dummyContent = 'Hello World';
    const { data: upload, error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/avatar.txt`, dummyContent, { contentType: 'text/plain', upsert: true });
    
    console.log('Storage Upload Error:', uploadErr ? uploadErr.message : 'None, Path: ' + (upload ? upload.path : ''));

    // Cleanup session
    await supabase.auth.signOut();
    
    console.log('\nAudit Script Complete');

  } catch (err) {
    console.error('Fatal Error:', err);
  }
}

runAudit();
