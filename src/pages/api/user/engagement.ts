
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    // 1. Securely validate the user token to get the user's identity
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'Access denied: Invalid or expired token' });
    }

    // 2. The incorrect admin check has been REMOVED. Any authenticated user can now proceed.

    const { engagement_type, points_earned, artist_uuid, metadata, week_identifier, completion_time } = req.body;

    try {
        // 3. Insert the engagement record for the validated user
        const { error } = await supabaseAdmin.from('user_engagements').insert([
            {
                user_id: user.id,
                engagement_type,
                points_earned,
                artist_uuid,
                metadata: {
                    ...metadata,
                    completion_time,
                },
                week_identifier
            },
        ]);

        if (error) {
            console.error('Error inserting user engagement:', error);
            throw new Error(`Failed to insert engagement: ${error.message}`);
        }

        // 4. Update the user's total points
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('total_points')
            .eq('user_id', user.id)
            .single();

        // If a profile exists, update points. If not, the trigger should have created one.
        if (profileError) {
             console.warn(`Could not fetch user profile to update points for user ${user.id}. It might not exist yet. Error: ${profileError.message}`);
        } else if (profile) {
            const newPoints = (profile.total_points || 0) + (points_earned || 0);

            const { error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update({ total_points: newPoints, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);

            if (updateError) {
                 console.error(`Failed to update total points for user ${user.id}: ${updateError.message}`);
                 // non-blocking, but good to know
            }
        }

        res.status(200).json({ success: true, message: "Engagement recorded successfully." });
    } catch (error: any) {
        console.error('Engagement API critical error:', error.message);
        res.status(500).json({ error: error.message });
    }
}
