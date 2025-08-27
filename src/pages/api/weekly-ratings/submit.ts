
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
      
      // Get the actual slider values from quadrantPositions
      const sliderValues = quadrantPositions?.[artistId];
      const ticketInterest = sliderValues?.ticket || 0;
      const shareInterest = sliderValues?.share || 0;
      
      // Insert or update the weekly vote using service role - SAVE ORIGINAL SLIDER VALUES
      const { error: voteError } = await supabaseAdmin
        .from('weekly_votes')
        .upsert({
          auth_id: user.id,
          artist_uuid: artistId,
          week_identifier: weekId,
          vote_type: 'quadrant',
          ticket_interest: ticketInterest, // ✅ FIXED: Save actual ticket slider value (-1 to 1)
          share_interest: shareInterest,   // ✅ FIXED: Save actual share slider value (-1 to 1)
          quadrant: quadrant,              // ✅ Keep quadrant for compatibility (1-4)
          ranking_position: position || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'auth_id,artist_uuid,week_identifier',
          ignoreDuplicates: false
        });

      if (voteError) {
        console.error(`❌ Error saving vote for artist ${artistId}:`, voteError);
        throw voteError;
      }

      return { artistId, success: true };
    });

    // Wait for all votes to be processed
    const voteResults = await Promise.all(votingPromises);
    
    // ✅ FIXED: Record proper user engagement - just "quadrant" not "weekly_rating_completion"
    const { error: engagementError } = await supabaseAdmin
      .from('user_engagements')
      .insert({
        auth_id: user.id,
        engagement_type: 'quadrant', // ✅ FIXED: Use standard "quadrant" engagement type
        points_earned: 10,
        week_identifier: weekId,
        artist_uuid: artistRatings[0]?.artistId || null, // ✅ FIXED: Include artist_uuid for single votes
        metadata: {
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

    // ✅ FIXED: Remove the failing RPC call - handle points update directly
    // Update user's total points directly using service role
    const { error: pointsUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        total_points: userProfile.total_points + 10,
        updated_at: new Date().toISOString()
      })
      .eq('auth_id', user.id);

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