
import { supabase } from "@/integrations/supabase/client";

export class VotingService {
  async submitVote(userId: number, artistId: string): Promise<void> {
    try {
      const { error } = await supabase.from("top25_votes").insert([
        {
          user_id: userId.toString(),
          artist_uuid: artistId,
        },
      ]);

      if (error) {
        console.error("Error submitting vote:", error);
        throw new Error(`Failed to submit vote: ${error.message}`);
      }
    } catch (err) {
      console.error("Unexpected error in submitVote:", err);
      if (err instanceof Error) {
        throw new Error(`An unexpected error occurred: ${err.message}`);
      }
      throw new Error("An unexpected error occurred while submitting the vote.");
    }
  }

  async submitVotes(
    votes: { user_id: string; artist_uuid: string }[]
  ): Promise<void> {
    const { error } = await supabase.from("top25_votes").insert(votes);
    
    if (error) {
      console.error("Error submitting votes:", error);
      throw error;
    }
  }

  async getUserVotes(userId: string) {
    const { data, error } = await supabase
      .from("top25_votes")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  }

  async enterTicketDrawing(email: string, username: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).substring(2, 15), 
      options: {
        data: {
          username: username
        }
      }
    });

    if (authError) {
        if (!authError.message.includes("User already registered")) {
            throw authError;
        }
    }
    
    const userId = authData?.user?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("insert_ticket_entry", {
      p_email: email,
      p_username: username,
      p_user_id: userId
    });

    if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
            return null;
        }
        throw error;
    }
    return data;
  }
}

export const votingService = new VotingService();
