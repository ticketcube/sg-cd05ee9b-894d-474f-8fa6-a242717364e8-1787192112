
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { auth_id } = req.query;

  if (!auth_id || typeof auth_id !== 'string') {
    return res.status(400).json({ error: 'auth_id parameter is required' });
  }

  try {
    console.log(`[API] Getting profile for auth_id: ${auth_id}`);

    // Use service role to get profile - bypasses RLS
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('auth_id', auth_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[API] Profile not found for auth_id: ${auth_id}`);
        return res.status(404).json({ error: 'Profile not found' });
      }
      console.error('[API] Database error:', error);
      throw error;
    }

    console.log(`[API] Profile found: ${profile.id} - ${profile.username}`);
    return res.status(200).json(profile);

  } catch (error) {
    console.error('[API] Error getting profile:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
