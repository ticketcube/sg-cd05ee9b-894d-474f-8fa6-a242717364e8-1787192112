
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
    // Use raw SQL query to avoid complex type inference
    const { data, error } = await supabaseAdmin.rpc('check_user_engagement', {
      p_user_id: userId,
      p_artist_id: artistId,
      p_engagement_type: engagementType
    });

    if (error) {
      console.error('Error checking rating:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ hasRated: data || false });
  } catch (error) {
    console.error('Error checking rating:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
