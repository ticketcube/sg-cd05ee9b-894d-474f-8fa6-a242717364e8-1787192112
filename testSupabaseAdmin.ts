import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  const { data, error } = await supabaseAdmin
    .from('city_latlong')
    .select('*')
    .limit(1);

  console.log('Data:', data);
  console.log('Error:', error);
}

test();