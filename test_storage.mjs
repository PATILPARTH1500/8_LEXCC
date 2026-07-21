import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually to get credentials
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

let url = '';
let key = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function checkBuckets() {
  console.log('--- Connecting to Live Supabase Project ---');
  console.log('URL:', url);
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error fetching buckets:', error.message);
    return;
  }
  
  console.log('\n--- Live Storage Buckets ---');
  if (buckets.length === 0) {
    console.log('NO BUCKETS FOUND.');
  } else {
    buckets.forEach(b => {
      console.log(`- ${b.name} (Public: ${b.public})`);
    });
  }
}

checkBuckets();
