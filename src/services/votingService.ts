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
  async submitVotes(votes: { username: string; artist_uuid: string; artist_otwid: number | null }[]): Promise<void> {
    const { error } = await supabase
      .from("top25_votes")
      .insert(votes.map(vote => ({
        username: vote.username,
        artist_uuid: vote.artist_uuid,
        artist_otwid: vote.artist_otwid,
      })));
    
    if (error) {
      console.error("Error submitting votes:", error);
      throw error;
    }
  },

  async getUserVotes(username: string) {
    const { data, error } = await supabase
      .from('top25_votes')
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

    if (authError) {
        // If user already exists, we can just ignore the error and proceed,
        // as the main goal is to get them into the ticket drawing.
        if (!authError.message.includes('User already registered')) {
            throw authError;
        }
    }
    
    // If a new user was created, use their ID. If they already existed, authData.user will be null.
    const userId = authData?.user?.id;

    // Then save to ticket entries table using raw SQL to avoid type issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('insert_ticket_entry', {
      p_email: email,
      p_username: username,
      p_user_id: userId
    });

    if (error) {
        // Handle potential unique constraint violation on email if they've already entered
        if (error.message.includes('duplicate key value violates unique constraint')) {
            // You can either inform the user they've already entered or just silently ignore it.
            // We'll ignore it silently to proceed to the "Thank You" screen.
            return null;
        }
        throw error;
    }
    return data;
  }
};

export default votingService;
