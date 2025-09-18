
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user's favorite artists based on quadrant ratings
    // Include all artists with valid quadrant ratings (non-null values)
    // Sort by x_quadrant descending (1 is best/top), then y_quadrant descending for ties
    const { data: userEngagements, error: engagementsError } = await supabaseAdmin
      .from('user_engagements')
      .select('artist_uuid, x_quadrant, y_quadrant')
      .eq('user_id', user.id)
      .eq('engagement_type', 'quadrant')
      .not('x_quadrant', 'is', null)
      .not('y_quadrant', 'is', null)
      .not('artist_uuid', 'is', null)
      .order('x_quadrant', { ascending: false })  // 1 is best, descending order
      .order('y_quadrant', { ascending: false })  // Tiebreaker: y_quadrant descending
      .limit(12);

    if (engagementsError) {
      console.error('Error fetching user engagements:', engagementsError);
      return res.status(500).json({ error: 'Failed to fetch user ratings' });
    }

    if (!userEngagements || userEngagements.length === 0) {
      return res.status(200).json({ artists: [] });
    }

    // Get the artist UUIDs to fetch artist details
    const artistUuids = userEngagements.map(e => e.artist_uuid);

    // Now fetch artist details for those UUIDs
    const { data: artistsData, error: artistsError } = await supabaseAdmin
      .from('artists')
      .select('uuid, artist_name, artist_genre, artist_home, artist_image, artist_videolink')
      .in('uuid', artistUuids);

    if (artistsError) {
      console.error('Error fetching artists data:', artistsError);
      return res.status(500).json({ error: 'Failed to fetch artist details' });
    }

    // Combine engagement data with artist data, maintaining sort order
    const enrichedArtists = userEngagements
      .map(engagement => {
        const artistData = artistsData?.find(artist => artist.uuid === engagement.artist_uuid);
        if (!artistData) return null;
        
        return {
          ...artistData,
          x_quadrant: engagement.x_quadrant,
          y_quadrant: engagement.y_quadrant
        };
      })
      .filter(artist => artist !== null); // Remove any artists not found

    return res.status(200).json({ artists: enrichedArtists });

  } catch (error) {
    console.error('Favorite Artists API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
