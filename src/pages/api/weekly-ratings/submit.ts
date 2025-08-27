
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user's session from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user's session using the regular supabase client
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { 
      weekId, 
      artistRatings, 
      quadrantPositions,
      completionTime 
    } = req.body;

    if (!weekId || !artistRatings || !Array.isArray(artistRatings)) {
      return res.status(400).json({ error: 'Missing required fields: weekId, artistRatings' });
    }

    console.log(`📊 [WeeklyRatings] Processing submission for user: ${user.id}, week: ${weekId}`);

    // Use supabaseAdmin (service role) to bypass RLS policies
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Process each artist rating using service role
    const votingPromises = artistRatings.map(async (rating: any) => {
      const { artistId, quadrant, position } = rating;
      
      // Insert or update the weekly vote using service role
      const { error: voteError } = await supabaseAdmin
        .from('weekly_votes')
        .upsert({
          auth_id: user.id, // ✅ FIXED: Use auth_id instead of user_auth_id
          artist_uuid: artistId,
          week_identifier: weekId, // ✅ FIXED: Use week_identifier instead of week_id
          vote_type: 'quadrant', // ✅ FIXED: Add vote_type field
          quadrant_x: quadrant || null,
          quadrant_y: quadrant || null,
          ranking_position: position || null,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'auth_id,artist_uuid,week_identifier' // ✅ FIXED: Update conflict resolution
        });

      if (voteError) {
        console.error(`❌ Error saving vote for artist ${artistId}:`, voteError);
        throw voteError;
      }

      return { artistId, success: true };
    });

    // Wait for all votes to be processed
    const voteResults = await Promise.all(votingPromises);
    
    // Record user engagement using service role
    const { error: engagementError } = await supabaseAdmin
      .from('user_engagements')
      .insert({
        auth_id: user.id, // ✅ FIXED: Use auth_id instead of user_auth_id
        engagement_type: 'weekly_rating_completion', // ✅ FIXED: Use engagement_type instead of action_type
        points_earned: 10, // Base points for completing weekly ratings
        week_identifier: weekId,
        metadata: {
          week_identifier: weekId,
          artists_rated: artistRatings.length,
          completion_time: completionTime,
          quadrant_positions: quadrantPositions
        },
        created_at: new Date().toISOString()
      });

    if (engagementError) {
      console.error('❌ Error recording user engagement:', engagementError);
      // Don't fail the entire request for engagement tracking errors
    }

    // Update user's total points using service role - need to check RPC function parameters
    const { error: pointsUpdateError } = await supabaseAdmin.rpc(
      'increment_user_points',
      { 
        points_to_add: 10,
        user_id_to_update: userProfile.id // ✅ FIXED: Use the numeric profile ID from user_profiles table
      }
    );

    if (pointsUpdateError) {
      console.error('❌ Error updating user points:', pointsUpdateError);
      // Don't fail the entire request for points update errors
    }

    console.log(`✅ [WeeklyRatings] Successfully processed ${voteResults.length} votes for user: ${user.id}`);

    res.status(200).json({ 
      success: true, 
      message: 'Weekly ratings submitted successfully',
      votesProcessed: voteResults.length,
      pointsEarned: 10
    });

  } catch (error) {
    console.error('🚨 [WeeklyRatings] Submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit weekly ratings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}