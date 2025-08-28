require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `SET (${supabaseServiceKey.length} chars)` : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  try {
    console.log('\n🔍 Testing Supabase Admin connection...');
    const { data, error } = await supabaseAdmin
      .from('city_latlong')
      .select('*')
      .limit(1);

    console.log('\n📊 Results:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0 && !error) {
      console.log('\n✅ SUCCESS: Service key has full access to city_latlong table');
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    } else if (error) {
      console.log('\n❌ ERROR: Issue with service key or table access');
      console.log('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('\n⚠️ WARNING: No data returned (table might be empty)');
    }
  } catch (err) {
    console.error('\n💥 EXCEPTION:', err.message);
  }
}

test();