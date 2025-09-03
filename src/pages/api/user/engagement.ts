
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, verifyUserOwnership, getUserProfileByAuthId } from '@/lib/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify user authentication
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token with client-side supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { userId, engagementType, pointsEarned, weekIdentifier, artistUuid, metadata } = req.body;

    // Verify user owns this engagement
    const isOwner = await verifyUserOwnership(user.id, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Record engagement with service role
    const { data: engagement, error } = await supabaseAdmin
      .from('user_engagements')
      .insert({
        user_id: userId,  // ✅ FIXED: Use user_id instead of auth_id to match new database schema
        engagement_type: engagementType,
        points_earned: pointsEarned,
        week_identifier: weekIdentifier,
        artist_uuid: artistUuid,
        metadata: metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Update user points atomically
    const { error: pointsError } = await supabaseAdmin.rpc('increment_user_points', {
      points_to_add: pointsEarned,
      user_id: userId  // ✅ FIXED: Use user_id parameter name
    });

    if (pointsError) throw pointsError;

    return res.status(200).json({ success: true, engagement });
    
  } catch (error) {
    console.error('Engagement API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}