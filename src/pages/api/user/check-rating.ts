
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, artistId, engagementType } = req.body;

  if (!userId || !artistId || !engagementType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_engagements')
      .select('id')
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .eq('engagement_type', engagementType)
      .limit(1);

    if (error) {
      console.error('Error checking rating:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ hasRated: data && data.length > 0 });
  } catch (error) {
    console.error('Error checking rating:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
