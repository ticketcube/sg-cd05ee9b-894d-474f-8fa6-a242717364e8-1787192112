
import { supabase } from "@/integrations/supabase/client";

export interface Vote {
  id?: string;
  username: string;
  artist_otwid: number;
  created_at?: string;
}

export interface VoteSubmission {
  username: string;
  votes: number[];
  created_at?: string;
}

export const votingService = {
  async submitVotes(username: string, artistIds: number[]) {
    const votes = artistIds.map(artistId => ({
      username,
      artist_otwid: artistId
    }));

    const { data, error } = await supabase
      .from('votes')
      .insert(votes)
      .select();

    if (error) throw error;
    return data;
  },

  async getUserVotes(username: string) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('username', username);

    if (error) throw error;
    return data as Vote[];
  },

  async enterTicketDrawing(email: string, username: string) {
    // First, sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).substring(2, 15), // Generate random password
      options: {
        data: {
          username: username
        }
      }
    });

    if (authError) throw authError;

    // Then save to ticket entries table
    const { data, error } = await supabase
      .from('ticket_entries')
      .insert([{
        email,
        username,
        user_id: authData.user?.id
      }])
      .select();

    if (error) throw error;
    return data;
  }
};

export default votingService;
