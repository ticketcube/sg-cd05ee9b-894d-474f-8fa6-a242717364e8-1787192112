import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';

// Central place for engagement points configuration
const ENGAGEMENT_POINTS: { [key: string]: number } = {
    quadrant: 10,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'Access denied: Invalid or expired token' });
    }
    
    // Use more descriptive names from the frontend call
    const { engagementType, artistUuid, weekIdentifier, x_quadrant, y_quadrant, additionalData } = req.body;

    if (!engagementType || !artistUuid || !weekIdentifier) {
        return res.status(400).json({ error: 'Missing required engagement data.' });
    }

    try {
        // 1. UNIQUENESS CHECK
        const { data: existingEngagement, error: checkError } = await supabaseAdmin
            .from('user_engagements')
            .select('id')
            .eq('user_id', user.id)
            .eq('artist_uuid', artistUuid)
            .eq('week_identifier', weekIdentifier)
            .eq('engagement_type', engagementType)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking for existing engagement:', checkError);
            throw new Error(`Failed to check for engagement: ${checkError.message}`);
        }

        if (existingEngagement) {
            return res.status(200).json({ success: false, error: 'You have already completed this action for this artist this week.' });
        }

        // 2. Determine points on the backend
        const pointsEarned = ENGAGEMENT_POINTS[engagementType] || 0;

        // 3. Insert new engagement record
        const { error: insertError } = await supabaseAdmin.from('user_engagements').insert([
            {
                user_id: user.id,
                engagement_type: engagementType,
                points_earned: pointsEarned,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                metadata: {
                    x_quadrant,
                    y_quadrant,
                    ...additionalData
                }
            },
        ]);

        if (insertError) {
            console.error('Error inserting user engagement:', insertError);
            throw new Error(`Failed to insert engagement: ${insertError.message}`);
        }
        
        // 4. Update user's total points if points were earned
        if (pointsEarned > 0) {
            const { error: rpcError } = await supabaseAdmin.rpc('increment_user_points', {
                user_id: user.id,
                points_to_add: pointsEarned,
            });

            if (rpcError) {
                console.error(`Failed to update total points for user ${user.id} via RPC: ${rpcError.message}`);
            }
        }
        
        res.status(200).json({ success: true, pointsEarned, message: "Engagement recorded successfully." });

    } catch (error: any) {
        console.error('Engagement API critical error:', error.message);
        res.status(500).json({ error: error.message, success: false });
    }
}
