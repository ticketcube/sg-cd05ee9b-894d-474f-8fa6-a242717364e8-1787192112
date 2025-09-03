import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ FIXED: Accept both user_id and auth_id for backward compatibility during migration
  const user_id = req.query.user_id || req.query.auth_id;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id parameter is required' });
  }

  try {
    console.log(`[API] Getting profile for user_id: ${user_id}`);

    // Validate environment variables before creating client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('[API] Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing Supabase URL' 
      });
    }

    if (!supabaseServiceKey) {
      console.error('[API] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return res.status(500).json({ 
        error: 'Server configuration error: Missing service role key' 
      });
    }
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Key:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + "...");

    // Create admin client with service role key
    console.log(`[API] Creating Supabase admin client...`);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`[API] Querying user_profiles table for user_id: ${user_id}`);
    
    // ✅ FIXED: Use user_id column instead of auth_id
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      console.error('[API] Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      if (error.code === 'PGRST116') {
        console.log(`[API] Profile not found for user_id: ${user_id}`);
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Return more specific error information
      return res.status(500).json({ 
        error: 'Database query failed',
        code: error.code,
        message: error.message,
        details: error.details
      });
    }

    if (!profile) {
      console.log(`[API] No profile data returned for user_id: ${user_id}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    console.log(`[API] Profile found successfully: ${profile.id} - ${profile.username}`);
    return res.status(200).json(profile);

  } catch (error) {
    console.error('[API] Unexpected error in profile-by-user-id:', error);
    
    // Return detailed error information for debugging
    const errorResponse = {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    return res.status(500).json(errorResponse);
  }
}
