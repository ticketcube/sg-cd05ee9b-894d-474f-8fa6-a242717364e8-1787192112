import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createServerSupabaseClient({ req, res });

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { actionName, artistUuid, weekIdentifier, metadata } = req.body;
        const userId = session.user.id;

        // Use service role for database operations
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

        // Get points configuration
        const { data: configData } = await supabaseAdmin
            .from('points_config')
            .select('*')
            .eq('action_name', actionName)
            .single();

        if (!configData) {
            return res.status(400).json({ error: 'Invalid action name' });
        }

        // Check eligibility (server-side)
        // [Include eligibility logic here similar to eligibility endpoint]

        // Award points by inserting engagement record
        const { data: engagementData, error: engagementError } = await supabaseAdmin
            .from('user_engagements')
            .insert({
                user_id: userId,
                engagement_type: actionName,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                points_earned: configData.points_value,
                metadata: metadata || {},
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (engagementError) throw engagementError;

        // Update user's total points
        const { error: pointsError } = await supabaseAdmin
            .rpc('increment_user_points_by_user_id', {
                user_id_to_update: userId,
                points_to_add: configData.points_value
            });

        if (pointsError) throw pointsError;

        res.status(200).json({
            success: true,
            pointsAwarded: configData.points_value,
            engagement: engagementData
        });

    } catch (error) {
        console.error('Error awarding points:', error);
        res.status(500).json({ error: 'Failed to award points' });
    }
}