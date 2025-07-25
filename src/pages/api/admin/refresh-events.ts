
import type { NextApiRequest, NextApiResponse } from "next";
import { eventCacheService } from "@/services/eventCacheService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Starting batch event refresh from admin API...");
    
    // This will process all artists and cache their events
    await eventCacheService.refreshAllArtistEvents();
    
    // Get updated stats
    const stats = await eventCacheService.getEventStats();
    
    console.log("Batch event refresh completed successfully");
    
    return res.status(200).json({
      success: true,
      message: "Event cache refresh completed successfully",
      stats: {
        totalEvents: stats.totalEvents,
        activeArtists: stats.activeArtists,
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (error) {
    console.error("Error in batch event refresh:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh event cache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
