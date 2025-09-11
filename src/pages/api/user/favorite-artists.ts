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

    // Get user's most engaged artists from user_engagements
    const { data: engagements, error: engagementError } = await supabaseAdmin
      .from('user_engagements')
      .select(`
        artist_uuid,
        engagement_type
      `)
      .eq('user_id', user.id)
      .not('artist_uuid', 'is', null);

    if (engagementError) {
      console.error('Error fetching user engagements:', engagementError);
      return res.status(500).json({ error: 'Failed to fetch engagements' });
    }

    if (!engagements || engagements.length === 0) {
      return res.status(200).json({ artists: [] });
    }

    // Count engagements per artist
    const artistEngagementCounts: { [key: string]: number } = {};
    
    engagements.forEach(engagement => {
      if (engagement.artist_uuid) {
        artistEngagementCounts[engagement.artist_uuid] = 
          (artistEngagementCounts[engagement.artist_uuid] || 0) + 1;
      }
    });

    // Sort by engagement count and get top 12
    const sortedArtists = Object.entries(artistEngagementCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([uuid, count]) => ({ uuid, engagementCount: count }));

    if (sortedArtists.length === 0) {
      return res.status(200).json({ artists: [] });
    }

    // Get artist details
    const artistUuids = sortedArtists.map(a => a.uuid);
    
    const { data: artistDetails, error: artistError } = await supabaseAdmin
      .from('artists')
      .select(`
        uuid,
        artist_name,
        artist_genre,
        artist_home,
        artist_image_url,
        youtube_url
      `)
      .in('uuid', artistUuids);

    if (artistError) {
      console.error('Error fetching artist details:', artistError);
      return res.status(500).json({ error: 'Failed to fetch artist details' });
    }

    // Merge engagement counts with artist details
    const enrichedArtists = artistDetails?.map(artist => {
      const engagement = sortedArtists.find(s => s.uuid === artist.uuid);
      return {
        ...artist,
        engagementCount: engagement?.engagementCount || 0
      };
    }) || [];

    // Sort by engagement count again (in case the artist query changed order)
    enrichedArtists.sort((a, b) => b.engagementCount - a.engagementCount);

    return res.status(200).json({ artists: enrichedArtists });

  } catch (error) {
    console.error('Favorite Artists API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}