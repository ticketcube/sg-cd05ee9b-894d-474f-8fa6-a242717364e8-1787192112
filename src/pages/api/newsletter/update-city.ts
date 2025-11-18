import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key to bypass RLS
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("📨 API CALLED: /api/newsletter/update-city");
  console.log("🔑 Service Role Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("🌐 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    const { email, homeCity } = req.body;

    console.log("📥 Request body:", { email, homeCity });

    if (!email) {
      console.error("❌ No email provided");
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log("🔍 Step 1: Looking for subscriber:", normalizedEmail);

    // First verify the subscriber exists and is active
    const { data: subscriber, error: checkError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, status, home_city")
      .eq("email", normalizedEmail)
      .single();

    console.log("📊 Step 2: Check result:", {
      found: !!subscriber,
      status: subscriber?.status,
      currentHomeCity: subscriber?.home_city,
      error: checkError ? {
        message: checkError.message,
        code: checkError.code,
        details: checkError.details
      } : null
    });

    if (checkError) {
      console.error("❌ Check error:", checkError);
      
      // If not found, maybe they aren't active?
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: "Email not found in subscribers. Please sign up first."
        });
      }
      
      throw checkError;
    }

    if (!subscriber) {
      console.error("❌ Subscriber not found");
      return res.status(404).json({
        success: false,
        message: "Subscriber not found."
      });
    }

    if (subscriber.status !== 'active') {
      console.warn("⚠️ Subscriber is not active:", subscriber.status);
      return res.status(403).json({
        success: false,
        message: "Your subscription is not active. Please re-subscribe first."
      });
    }

    console.log("✅ Step 3: Subscriber verified, updating home_city...");

    // Update using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ home_city: homeCity })
      .eq("email", normalizedEmail)
      .select()
      .single();

    console.log("📊 Step 4: Update result:", {
      success: !!data,
      newHomeCity: data?.home_city,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) {
      console.error("❌ Update failed:", error);
      throw error;
    }

    if (!data) {
      console.error("❌ Update returned no data");
      return res.status(500).json({
        success: false,
        message: "Update failed - no data returned"
      });
    }

    console.log("✅ SUCCESS: City updated successfully");

    return res.status(200).json({
      success: true,
      message: homeCity 
        ? `City preference updated to ${homeCity}!` 
        : "City preference cleared.",
      data: {
        email: data.email,
        home_city: data.home_city
      }
    });
  } catch (error: any) {
    console.error("💥 FATAL ERROR:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to update: ${error?.message || "Unknown error"}`,
      debug: {
        code: error?.code,
        details: error?.details
      }
    });
  }
}
