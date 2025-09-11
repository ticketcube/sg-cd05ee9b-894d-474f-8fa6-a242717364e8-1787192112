
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, artistId, engagementType } = req.body;

  if (!userId || !artistId || !engagementType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Use a simple count query to check existence
    const { count, error } = await supabase
      .from('user_engagements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('artist_id', artistId)
      .eq('engagement_type', engagementType);

    if (error) {
      console.error('Error checking rating:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ hasRated: (count || 0) > 0 });
  } catch (error) {
    console.error('Error checking rating:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
