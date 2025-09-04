import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createServerSupabaseClient({ req, res });

        // Get user session to ensure authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Use service role for actual database query
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

        const { data, error } = await supabaseAdmin
            .from('points_config')
            .select('*');

        if (error) throw error;

        // Convert to cache format
        const configMap: any = {};
        data.forEach(config => {
            configMap[config.action_name] = config;
        });

        res.status(200).json(configMap);
    } catch (error) {
        console.error('Error fetching points config:', error);
        res.status(500).json({ error: 'Failed to fetch points configuration' });
    }
}
File: src / pages / api / points / eligibility.ts

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

        const { actionName, artistUuid, weekIdentifier } = req.body;
        const userId = session.user.id;

        // Use service role for database queries
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

        // First get the frequency rule
        const { data: configData } = await supabaseAdmin
            .from('points_config')
            .select('frequency')
            .eq('action_name', actionName)
            .single();

        if (!configData) {
            return res.status(400).json({ error: 'Invalid action name' });
        }

        const frequency = configData.frequency || 'once';

        // Check eligibility based on frequency
        let query = supabaseAdmin
            .from('user_engagements')
            .select('id')
            .eq('user_id', userId)
            .eq('engagement_type', actionName)
            .gt('points_earned', 0)
            .limit(1);

        if (frequency === 'once_per_artist_lifetime' && artistUuid) {
            query = query.eq('artist_uuid', artistUuid);
        } else if (frequency === 'once_per_artist_per_week' && artistUuid && weekIdentifier) {
            query = query.eq('artist_uuid', artistUuid).eq('week_identifier', weekIdentifier);
        } else if (frequency === 'once_per_week' && weekIdentifier) {
            query = query.eq('week_identifier', weekIdentifier);
        }

        const { data, error } = await query;
        if (error) throw error;

        const eligible = frequency === 'unlimited' || !data || data.length === 0;

        res.status(200).json({ eligible });
    } catch (error) {
        console.error('Error checking eligibility:', error);
        res.status(500).json({ error: 'Failed to check eligibility' });
    }
}