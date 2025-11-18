import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, homeCity } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log("🔍 API: Updating home_city:", { 
      email: normalizedEmail, 
      homeCity,
      timestamp: new Date().toISOString()
    });

    // First verify the subscriber exists and is active
    const { data: subscriber, error: checkError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, status")
      .eq("email", normalizedEmail)
      .eq("status", "active")
      .single();

    if (checkError || !subscriber) {
      console.warn("⚠️ Subscriber not found or inactive:", normalizedEmail);
      return res.status(404).json({
        success: false,
        message: "Subscriber not found or inactive."
      });
    }

    // Update using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ home_city: homeCity })
      .eq("email", normalizedEmail)
      .select()
      .single();

    if (error) {
      console.error("❌ API: Update error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log("✅ API: Update successful:", data);

    return res.status(200).json({
      success: true,
      message: homeCity 
        ? `City preference updated to ${homeCity}!` 
        : "City preference cleared.",
      data
    });
  } catch (error: any) {
    console.error("💥 API: Error updating home city:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to update: ${error?.message || "Unknown error"}`
    });
  }
}
