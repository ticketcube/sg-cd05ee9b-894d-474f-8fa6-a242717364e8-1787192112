import { supabase } from "@/integrations/supabase/client";

class VideoWatchService {
  /**
   * Records that a user has watched a video and awards points if applicable.
   * This now sends artistId and listId to ensure uniqueness per artist per list.
   * @param artistId - The ID of the artist (from artists table).
   * @param listId - The ID of the weekly list (from weekly_lists table).
   */
  async recordVideoWatch(artistId: number, listId: number): Promise<{ pointsEarned: number; message: string; }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User is not authenticated.");
      }

      const response = await fetch("/api/user/video-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          artistId,
          listId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the error message from the API if available, otherwise a generic one.
        throw new Error(result.error || `API Error: ${response.status}`);
      }
      
      console.log("✅ Video watch recorded:", result);
      
      // The API response should include pointsEarned and a message.
      return {
        pointsEarned: result.pointsEarned || 0,
        message: result.message || "",
      };

    } catch (error) {
      console.error("Error recording video watch:", error);
      // Re-throw the error so the calling component can handle it (e.g., show a toast).
      throw error;
    }
  }
}

export const videoWatchService = new VideoWatchService();