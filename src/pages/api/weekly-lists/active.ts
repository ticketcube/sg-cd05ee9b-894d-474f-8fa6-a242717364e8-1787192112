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
    console.log('[API] Getting all active weekly lists...');

    // Get all active weekly lists with embedded artists data
    const { data: weeklyLists, error: listsError } = await supabaseAdmin
      .from('weekly_lists')
      .select(`
        *,
        weekly_list_artists (
          *,
          artists (
            *
          )
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (listsError) {
      console.error('[API] Error fetching weekly lists:', listsError);
      throw listsError;
    }

    if (!weeklyLists || weeklyLists.length === 0) {
      console.log('[API] No active weekly lists found');
      return res.status(404).json({ error: 'No active weekly lists found' });
    }

    console.log('[API] Found active weekly lists:', weeklyLists.length);

    // Map the data to match expected format with artists array
    const result = weeklyLists.map(list => ({
      ...list,
      artists: list.weekly_list_artists?.map(wla => ({
        ...wla,
        artist_videolink: wla.artists?.artist_videolink,
        artist_name: wla.artists?.artist_name,
        artist_image: wla.artists?.artist_image,
        // Include all artist data
        ...wla.artists
      })) || []
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error('[API] Error getting active weekly lists:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
