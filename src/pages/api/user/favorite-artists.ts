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
    // Only include artists with ratings > 0 for both x and y quadrants
    // Sort by x_quadrant descending (1 is best/top), then y_quadrant descending for ties
    const { data: favoriteArtists, error: ratingsError } = await supabaseAdmin
      .from('user_ratings')
      .select(`
        artist_uuid,
        x_quadrant,
        y_quadrant,
        artists!user_ratings_artist_uuid_fkey (
          uuid,
          artist_name,
          artist_genre,
          artist_home,
          artist_image,
          artist_videolink
        )
      `)
      .eq('user_id', user.id)
      .gt('x_quadrant', 0)
      .gt('y_quadrant', 0)
      .not('artist_uuid', 'is', null)
      .order('x_quadrant', { ascending: false })  // 1 is best, descending order
      .order('y_quadrant', { ascending: false })  // Tiebreaker: y_quadrant descending
      .limit(12);

    if (ratingsError) {
      console.error('Error fetching user ratings:', ratingsError);
      return res.status(500).json({ error: 'Failed to fetch favorite artists' });
    }

    if (!favoriteArtists || favoriteArtists.length === 0) {
      return res.status(200).json({ artists: [] });
    }

    // Transform the data to match the expected format
    const enrichedArtists = favoriteArtists
      .filter(rating => rating.artists) // Ensure artist data exists
      .map(rating => ({
        ...rating.artists,
        x_quadrant: rating.x_quadrant,
        y_quadrant: rating.y_quadrant
      }));

    return res.status(200).json({ artists: enrichedArtists });

  } catch (error) {
    console.error('Favorite Artists API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
