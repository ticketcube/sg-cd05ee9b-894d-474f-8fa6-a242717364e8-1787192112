import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { WeeklyList, WeeklyListWithArtists, WeeklyListWithEnrichedArtists } from "@/types/weekly";
import { EnrichedWeeklyListArtist } from "@/types/artists";

export const weeklyListService = {
    async getAllWeeklyLists(): Promise<WeeklyList[]> {
        const { data, error } = await supabase
            .from('weekly_lists')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error("Error fetching all weekly lists:", error);
            throw error;
        }

        return data || [];
    },

    async getActiveWeeklyList(): Promise<WeeklyListWithArtists | null> {
        const { data, error } = await supabase
            .from('weekly_lists')
            .select(`
                *,
                artists:weekly_list_artists (
                    *
                )
            `)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error("Error fetching active weekly list:", error);
            return null;
        }
        return data as WeeklyListWithArtists;
    },

    async getActiveWeeklyListWithArtists(): Promise<WeeklyListWithEnrichedArtists | null> {
        const { data: listData, error: listError } = await supabase
            .from('weekly_lists')
            .select('id, name, description, start_date, end_date')
            .eq('is_active', true)
            .single();

        if (listError || !listData) {
            console.error('Error fetching active weekly list:', listError?.message);
            return null;
        }

        const { data: artistsData, error: artistsError } = await supabase
            .from('weekly_list_artists')
            .select(`
                artist_uuid,
                video_url,
                artists ( * )
            `)
            .eq('weekly_list_id', listData.id);

        if (artistsError) {
            console.error('Error fetching artists for weekly list:', artistsError?.message);
            return null;
        }

        const enrichedArtists: EnrichedWeeklyListArtist[] = artistsData.map((item: any) => ({
            ...item.artists,
            weekly_list_id: listData.id,
            artist_uuid: item.artist_uuid,
            video_url: item.video_url,
        }));

        return {
            ...listData,
            artists: enrichedArtists
        } as WeeklyListWithEnrichedArtists;
    },

    async getWeeklyListForUser(listId: string, userId: string): Promise<WeeklyListWithEnrichedArtists | null> {
        const list = await this.getActiveWeeklyListWithArtists(); // Simplified for now
        if (!list || list.id.toString() !== listId) return null;

        const artistUuids = list.artists.map(a => a.uuid);

        // Get user's votes for this list
        const { data: votes, error: votesError } = await supabase
            .from('weekly_votes')
            .select('artist_uuid, ticket_interest, share_interest')
            .eq('weekly_list_id', listId)
            .eq('user_id', userId)
            .in('artist_uuid', artistUuids);

        // Get user's video views for this list's artists
        const { data: views, error: viewsError } = await supabase
            .from('user_engagements')
            .select('artist_uuid')
            .eq('user_id', userId)
            .eq('engagement_type', 'video_view')
            .in('artist_uuid', artistUuids);

        if (votesError || viewsError) {
            console.error("Error fetching user data for list", { votesError, viewsError });
            // proceed with partial data
        }

        const votesMap = new Map(votes?.map(v => [v.artist_uuid, v]));
        const viewsSet = new Set(views?.map(v => v.artist_uuid));

        list.artists.forEach(artist => {
            const vote = votesMap.get(artist.uuid);
            artist.is_rated = !!vote;
            artist.ticket_interest = vote?.ticket_interest;
            artist.share_interest = vote?.share_interest;
            artist.user_has_watched = viewsSet.has(artist.uuid);
        });

        return list;
    },
};
