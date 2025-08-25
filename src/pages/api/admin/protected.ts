
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, verifyAdminAccess } from '@/lib/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user?.email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Admin operations go here
    switch (req.method) {
      case 'GET':
        // Return admin stats
        const { data: userStats } = await supabaseAdmin
          .from('user_profiles')
          .select('id', { count: 'exact' });
          
        const { data: engagementStats } = await supabaseAdmin
          .from('user_engagements')
          .select('id', { count: 'exact' });

        return res.status(200).json({ 
          stats: {
            totalUsers: userStats?.length || 0,
            totalEngagements: engagementStats?.length || 0
          }
        });
        
      case 'POST':
        // Admin operations
        const { operation, data } = req.body;
        
        if (operation === 'refresh_events') {
          // Event refresh logic here  
          return res.status(200).json({ success: true });
        }
        
        return res.status(400).json({ error: 'Unknown operation' });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
