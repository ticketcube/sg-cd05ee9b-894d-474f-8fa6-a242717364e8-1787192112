
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client (server-side only)
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { profile_id } = req.query;
        
        if (!profile_id || isNaN(Number(profile_id))) {
            return res.status(400).json({ error: "Valid profile_id is required" });
        }
        
        const profileId = Number(profile_id);
        console.log("🔍 [Secure Profile by ID API] Looking up profile for ID:", profileId);
        
        // Use admin client to query user profile by ID
        const { data: profile, error } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .eq("id", profileId)
            .single();
        
        if (error) {
            if (error.code === "PGRST116") {
                console.log("⚠️ [Secure Profile by ID API] Profile not found for ID:", profileId);
                return res.status(404).json({ error: "Profile not found" });
            }
            console.error("❌ [Secure Profile by ID API] Database error:", error);
            return res.status(500).json({ error: "Database error", details: error.message });
        }
        
        if (!profile) {
            console.log("⚠️ [Secure Profile by ID API] No profile returned for ID:", profileId);
            return res.status(404).json({ error: "Profile not found" });
        }
        
        console.log("✅ [Secure Profile by ID API] Profile found:", profile.id, profile.username);
        return res.status(200).json({ profile });
        
    } catch (error) {
        console.error("🚨 [Secure Profile by ID API] Error:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
