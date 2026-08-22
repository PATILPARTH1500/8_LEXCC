import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const url = urlMatch[1];
const key = keyMatch[1];

async function fetchTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`\nTable ${table} sample:`, data);
  } else {
    console.error(`Error ${table}:`, await res.text());
  }
}

async function run() {
  await fetchTable('cart_items');
  await fetchTable('order_items');
  await fetchTable('orders');
}

run();
