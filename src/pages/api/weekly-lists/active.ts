
    import { NextApiRequest, NextApiResponse } from 'next';
    import { supabaseAdmin } from '@/lib/supabaseAdmin';
    import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from '@/types/weekly';
    import { Artist } from '@/types/artists'; // Import base Artist type for casting

    export default async function handler(
      req: NextApiRequest,
      res: NextApiResponse&lt;EnrichedWeeklyList[] | { error: string; details?: string }&gt;
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

        // New, robust mapping logic.
        const result: EnrichedWeeklyList[] = weeklyLists.map(list =&gt; {
          const artists: EnrichedWeeklyListArtist[] = (list.weekly_list_artists as any[])
            ?.map(wla =&gt; {
              const artistData = wla.artists as Artist | null;
              
              if (!artistData) {
                console.warn(`[API] Skipping weekly_list_artist with id ${wla.id} due to missing artist data.`);
                return null;
              }

              // Robustly create the enriched artist object.
              // 1. Spread all properties from the fetched artist record (`...artistData`).
              //    This includes `artist_videolink`, `artist_name`, `uuid`, etc.
              // 2. Explicitly add/overwrite the `id` with the numeric ID from the join table.
              return {
                ...artistData,
                id: wla.id,
              };
            })
            .filter((artist): artist is EnrichedWeeklyListArtist =&gt; artist !== null);
          
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
  