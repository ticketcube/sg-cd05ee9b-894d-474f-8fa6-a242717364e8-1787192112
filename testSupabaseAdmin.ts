const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  try {
    console.log('Testing Supabase Admin connection...');
    const { data, error } = await supabaseAdmin
      .from('city_latlong')
      .select('*')
      .limit(1);

    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0 && !error) {
      console.log('✅ SUCCESS: Service key has full access to city_latlong table');
    } else if (error) {
      console.log('❌ ERROR: Issue with service key or table access');
    } else {
      console.log('⚠️ WARNING: No data returned (table might be empty)');
    }
  } catch (err) {
    console.error('❌ EXCEPTION:', err);
  }
}

test();