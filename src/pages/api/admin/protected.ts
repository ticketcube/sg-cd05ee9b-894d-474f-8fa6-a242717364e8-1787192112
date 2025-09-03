import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * 🔒 SECURE ADMIN API ENDPOINT
 * 
 * Implements 3-step verification:
 * 1. Authenticate: Get user from session
 * 2. Authorize: Check user role in user_profiles table  
 * 3. Execute: Use supabaseAdmin for privileged operations
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Step 1: AUTHENTICATE - Get user from session cookie
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log("🚫 [Admin API] No valid session found");
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = session.user;
    console.log(`🔍 [Admin API] Authenticated user: ${user.id}`);

    // Step 2: AUTHORIZE - Check user role in user_profiles table
    // ✅ FIXED: Use user_id column instead of auth_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.log(`🚫 [Admin API] Profile not found for user: ${user.id}`);
      return res.status(403).json({ error: 'User profile not found' });
    }

    if (profile.role !== 'otwstaff') {
      console.log(`🚫 [Admin API] User role '${profile.role}' is not admin`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log("✅ [Admin API] Admin access verified");

    // Step 3: EXECUTE - Perform privileged admin operations
    switch (req.method) {
      case 'GET':
        // Return admin stats
        const { data: userStats, error: userStatsError } = await supabaseAdmin
          .from('user_profiles')
          .select('id', { count: 'exact' });
          
        const { data: engagementStats, error: engagementStatsError } = await supabaseAdmin
          .from('user_engagements')
          .select('id', { count: 'exact' });

        if (userStatsError || engagementStatsError) {
          console.error("❌ [Admin API] Error fetching stats:", userStatsError || engagementStatsError);
          return res.status(500).json({ error: 'Failed to fetch admin stats' });
        }

        return res.status(200).json({ 
          success: true,
          stats: {
            totalUsers: userStats?.length || 0,
            totalEngagements: engagementStats?.length || 0
          }
        });
        
      case 'POST':
        // Admin operations
        const { operation, data } = req.body;
        
        if (!operation) {
          return res.status(400).json({ error: 'Operation is required' });
        }
        
        switch (operation) {
          case 'refresh_events':
            // Event refresh logic here
            console.log("🔄 [Admin API] Refreshing events...");
            return res.status(200).json({ 
              success: true, 
              message: 'Events refresh initiated' 
            });
            
          case 'admin_test':
            // Test admin functionality
            return res.status(200).json({ 
              success: true, 
              message: 'Admin API is working correctly',
              user_id: user.id,
              role: profile.role
            });
            
          default:
            return res.status(400).json({ error: 'Unknown operation' });
        }
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('💥 [Admin API] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
