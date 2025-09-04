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
