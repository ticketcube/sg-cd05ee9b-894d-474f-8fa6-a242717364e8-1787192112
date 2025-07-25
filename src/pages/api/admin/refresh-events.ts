import type { NextApiRequest, NextApiResponse } from "next";
import { eventCacheService } from "@/services/eventCacheService";

// Increase timeout for this API route
export const config = {
  api: {
    responseTimeout: 300000, // 5 minutes
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Starting batch event refresh from admin API...");
    
    // Set headers for streaming response
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    
    // This will process all artists and cache their events
    await eventCacheService.refreshAllArtistEvents();
    
    // Get updated stats
    const stats = await eventCacheService.getEventStats();
    
    console.log("Batch event refresh completed successfully");
    
    return res.end(JSON.stringify({
      success: true,
      message: "Event cache refresh completed successfully",
      stats: {
        totalEvents: stats.totalEvents,
        activeArtists: stats.activeArtists,
        lastUpdated: stats.lastUpdated
      }
    }));
  } catch (error) {
    console.error("Error in batch event refresh:", error);
    return res.end(JSON.stringify({
      success: false,
      message: "Failed to refresh event cache",
      error: error instanceof Error ? error.message : "Unknown error"
    }));
  }
}
