
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("=== TESTING BRANDFOLDER API ===");

  try {
    // Get API key from environment
    const brandfolderApiKey = process.env.BF_API_KEY;
    console.log("🔑 API Key check:", { 
      hasApiKey: !!brandfolderApiKey,
      keyPrefix: brandfolderApiKey?.substring(0, 20) + "..." || "MISSING",
      keyLength: brandfolderApiKey?.length || 0
    });
    
    if (!brandfolderApiKey) {
      console.error("❌ Brandfolder API key not configured");
      return res.status(500).json({ error: "Brandfolder API key not configured" });
    }

    // Test the exact step 1 from your example
    console.log("🚀 Testing upload URL request...");
    const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${brandfolderApiKey}`
      }
    });

    console.log("📡 Response:", {
      status: uploadReq.status,
      statusText: uploadReq.statusText,
      headers: Object.fromEntries(uploadReq.headers.entries())
    });

    const responseText = await uploadReq.text();
    console.log("📋 Response body:", responseText);

    if (!uploadReq.ok) {
      return res.status(uploadReq.status).json({ 
        error: `Failed to get upload URL (${uploadReq.status}): ${uploadReq.statusText}`,
        response: responseText
      });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ 
        error: "Failed to parse response as JSON",
        response: responseText
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brandfolder API test successful",
      response: parsedResponse
    });

  } catch (error) {
    console.error("💥 TEST ERROR:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
