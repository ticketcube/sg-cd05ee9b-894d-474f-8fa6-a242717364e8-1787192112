import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from '@/types/weekly';
import { Artist } from '@/types/artists';

// Create admin client with service role key - you were right, this is correct!
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
        // This query is good, it fetches the nested artists.
        const { data: weeklyLists, error: listsError } = await supabaseAdmin
            .from('weekly_lists')
            .select(`
        *,
        weekly_list_artists (
          artists (
            *
          )
        )
      `)
            .eq('status', 'active') // Using your 'status' column.
            .order('created_at', { ascending: false });

        if (listsError) {
            console.error('[API] Error fetching weekly lists:', listsError);
            throw listsError;
        }

        if (!weeklyLists || weeklyLists.length === 0) {
            console.log('[API] No active weekly lists found');
            // Return 200 with an empty array, which is cleaner for the frontend.
            return res.status(200).json([]);
        }

        // This is the key change: Safely mapping the data to our new types.
        const enrichedData: EnrichedWeeklyList[] = weeklyLists.map(list => {
            // Filter out any entries where the nested artist is null.
            const validArtists: EnrichedWeeklyListArtist[] = (list.weekly_list_artists || [])
                .map(wla => wla.artists) // Extract the final artist object.
                .filter((artist): artist is Artist => artist !== null) // Use a type guard to ensure artist is not null.
                .map(artist => ({
                    ...artist,
                    // These user-specific properties are added on the client-side.
                    user_has_watched: undefined,
                    user_has_voted: undefined,
                }));

            // We remove the original 'weekly_list_artists' to match our EnrichedWeeklyList type.
            const { weekly_list_artists, ...restOfList } = list;

            return {
                ...restOfList,
                artists: validArtists,
            };
        });

        return res.status(200).json(enrichedData);

    } catch (error) {
        console.error('[API] Error getting active weekly lists:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}