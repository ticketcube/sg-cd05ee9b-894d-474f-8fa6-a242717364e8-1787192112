import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from '@/types/weekly';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnrichedWeeklyList[] | { error: string; details?: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: weeklyLists, error: listsError } = await supabaseAdmin
      .from('weekly_lists')
      .select(`
        *,
        weekly_list_artists (
          id,
          artists (*)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (listsError) {
      console.error('[API] Error fetching weekly lists:', listsError);
      throw listsError;
    }

    if (!weeklyLists || weeklyLists.length === 0) {
      return res.status(200).json([]);
    }

    const result: EnrichedWeeklyList[] = weeklyLists.map(list => {
      // @ts-ignore
      const artists: EnrichedWeeklyListArtist[] = list.weekly_list_artists
        ?.map(wla => {
          // @ts-ignore
          const artistData = wla.artists;
          if (!artistData) {
            return null;
          }

          // Create a clean artist object based on the database schema
          // and what the frontend components expect.
          return {
            // --- ID Mapping ---
            // Use the numeric ID from the join table (`weekly_list_artists`)
            // as the primary `id` the frontend uses for keys and interactions.
            id: wla.id,
            artist_id: wla.id, // for compatibility
            uuid: artistData.uuid,

            // --- Explicit Field Mapping from Schema ---
            artist_name: artistData.artist_name,
            artist_home: artistData.artist_home,
            artist_otwcreateddate: artistData.artist_otwcreateddate,
            artist_videolink: artistData.artist_videolink,
            artist_audiolink: artistData.artist_audiolink,
            artist_image: artistData.artist_image,
            artist_totallisteners: artistData.artist_totallisteners,
            artist_totalwatchers: artistData.artist_totalwatchers,
            artist_otwcategory: artistData.artist_otwcategory,
            artist_genre: artistData.artist_genre,
            artist_relatedartists: artistData.artist_relatedartists,
            artist_bio: artistData.artist_bio,
            attractionId: artistData.attractionId,
            artist_tiktok_username: artistData.artist_tiktok_username,
            artist_tiktok_videoid: artistData.artist_tiktok_videoid,
            Top_List: artistData.Top_List,
            artist_otwcoverage: artistData.artist_otwcoverage,
            primary_vibe: artistData.primary_vibe,
            secondary_vibe: artistData.secondary_vibe,
            cityid: artistData.cityid,
            
          } as EnrichedWeeklyListArtist;
        })
        .filter((artist): artist is EnrichedWeeklyListArtist => artist !== null) ?? [];
      
      // @ts-ignore
      const { weekly_list_artists, ...restOfList } = list;

      return {
        ...restOfList,
        artists: artists,
      };
    });

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[API /weekly-lists/active] Uncaught error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
