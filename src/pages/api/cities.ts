import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search } = req.query;
    
    let query = supabaseAdmin
      .from('city_latlong')
      .select('id, name, normalized_name, country_code, state_code')
      .order('normalized_name');

    if (search && typeof search === 'string') {
      query = query.or(`normalized_name.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching cities:', error);
      return res.status(500).json({ error: 'Failed to fetch cities' });
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
