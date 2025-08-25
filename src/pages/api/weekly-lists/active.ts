
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Getting active weekly list...');

    // Get the most recent active weekly list using service role
    const { data: weeklyList, error: listError } = await supabaseAdmin
      .from('weekly_lists')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (listError) {
      if (listError.code === 'PGRST116') {
        console.log('[API] No active weekly lists found');
        return res.status(404).json({ error: 'No active weekly list found' });
      }
      console.error('[API] Error fetching weekly list:', listError);
      throw listError;
    }

    console.log('[API] Found active weekly list:', weeklyList.id);

    // Get artists for this weekly list
    const { data: weeklyListArtists, error: artistsError } = await supabaseAdmin
      .from('weekly_list_artists')
      .select(`
        *,
        artist:artists(*)
      `)
      .eq('week_identifier', weeklyList.week_identifier)
      .order('position', { ascending: true });

    if (artistsError) {
      console.error('[API] Error fetching weekly list artists:', artistsError);
      throw artistsError;
    }

    console.log('[API] Found artists for weekly list:', weeklyListArtists?.length || 0);

    const result = {
      ...weeklyList,
      artists: weeklyListArtists || []
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('[API] Error getting active weekly list:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
