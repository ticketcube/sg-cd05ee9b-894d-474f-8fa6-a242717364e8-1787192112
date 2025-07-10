
import { supabase } from "@/integrations/supabase/client";

export interface Artist {
  artist_otwid: string;
  artist_name: string;
  artist_home: string;
  artist_otwcreateddate: string;
  artist_videolink: string;
  artist_audiolink: string;
  artist_image: string;
  artist_totallisteners: number;
  artist_totalwatchers: number;
  artist_otwcategory: string;
  artist_genre: string[];
  artist_relatedartists: string[];
  artist_bio: string;
}

export interface Top25Vote {
  username: string;
  artist_otwid: string;
}

export const artistService = {
  async getArtists(filters?: { category?: string; genres?: string[] }) {
    let query = supabase.from('artists').select('*');
    
    if (filters?.category) {
      query = query.eq('artist_otwcategory', filters.category);
    }
    
    if (filters?.genres && filters.genres.length > 0) {
      query = query.overlaps('artist_genre', filters.genres);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Artist[];
  },

  async getVoteCount(artist_otwid: string) {
    const { count, error } = await supabase
      .from('top25_votes')
      .select('*', { count: 'exact' })
      .eq('artist_otwid', artist_otwid);
    
    if (error) throw error;
    return count || 0;
  },

  async submitVote(vote: Top25Vote) {
    const { data, error } = await supabase
      .from('top25_votes')
      .insert([vote])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async getUserVotes(username: string) {
    const { data, error } = await supabase
      .from('top25_votes')
      .select('artist_otwid')
      .eq('username', username);
    
    if (error) throw error;
    return data.map(vote => vote.artist_otwid);
  },

  async isAdmin(email: string) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return false;
    return !!data;
  }
};

export default artistService;
