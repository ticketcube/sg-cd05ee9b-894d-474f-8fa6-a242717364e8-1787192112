
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
    console.log("🔒 [Secure Profile API] Request received:", req.method, req.body);
    
    if (req.method === "GET") {
        return handleGetProfile(req, res);
    } else if (req.method === "POST") {
        return handleCreateProfile(req, res);
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}

async function handleGetProfile(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { auth_id } = req.query;
        
        if (!auth_id || typeof auth_id !== "string") {
            return res.status(400).json({ error: "auth_id is required" });
        }
        
        console.log("🔍 [Secure Profile API] Looking up profile for auth_id:", auth_id);
        
        // Use admin client to query user profile
        const { data: profile, error } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .eq("auth_id", auth_id)
            .single();
        
        if (error) {
            if (error.code === "PGRST116") {
                console.log("⚠️ [Secure Profile API] Profile not found for auth_id:", auth_id);
                return res.status(404).json({ error: "Profile not found" });
            }
            console.error("❌ [Secure Profile API] Database error:", error);
            return res.status(500).json({ error: "Database error", details: error.message });
        }
        
        if (!profile) {
            console.log("⚠️ [Secure Profile API] No profile returned for auth_id:", auth_id);
            return res.status(404).json({ error: "Profile not found" });
        }
        
        console.log("✅ [Secure Profile API] Profile found:", profile.id, profile.username);
        return res.status(200).json({ profile });
        
    } catch (error) {
        console.error("🚨 [Secure Profile API] GET error:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

async function handleCreateProfile(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { auth_id, username, email, city } = req.body;
        
        console.log("🔍 [Secure Profile API] Creating profile with data:", { auth_id, username, email, city });
        
        if (!auth_id || !username || !email) {
            return res.status(400).json({ error: "auth_id, username, and email are required" });
        }
        
        // First check if profile already exists
        const { data: existingProfile, error: checkError } = await supabaseAdmin
            .from("user_profiles")
            .select("id, username")
            .eq("auth_id", auth_id)
            .single();
        
        if (checkError && checkError.code !== "PGRST116") {
            console.error("❌ [Secure Profile API] Error checking existing profile:", checkError);
            return res.status(500).json({ error: "Database error during profile check" });
        }
        
        if (existingProfile) {
            console.log("ℹ️ [Secure Profile API] Profile already exists:", existingProfile.id);
            return res.status(200).json({ 
                profile: existingProfile,
                message: "Profile already exists" 
            });
        }
        
        // Handle city lookup if provided
        let cityId: number | null = null;
        if (city && city.trim()) {
            const { data: cityData } = await supabaseAdmin
                .from("city_latlong")
                .select("id")
                .eq("normalized_name", city.trim().toLowerCase())
                .single();
            
            cityId = cityData?.id || null;
        }
        
        console.log("🏙️ [Secure Profile API] City lookup result:", { city, cityId });
        
        // Create the profile - the database will automatically assign an ID
        const profileData = {
            auth_id,
            username: username.trim(),
            email: email.trim(),
            city_id: cityId,
            raw_city_input: city?.trim() || null,
            total_points: 0,
            role: null
        };
        
        console.log("💾 [Secure Profile API] Inserting profile with data:", profileData);
        
        const { data: newProfile, error: insertError } = await supabaseAdmin
            .from("user_profiles")
            .insert(profileData)
            .select("*")
            .single();
        
        if (insertError) {
            console.error("❌ [Secure Profile API] Insert error:", insertError);
            return res.status(500).json({ 
                error: "Failed to create profile", 
                details: insertError.message 
            });
        }
        
        if (!newProfile) {
            console.error("❌ [Secure Profile API] No profile returned after insert");
            return res.status(500).json({ error: "Profile creation failed - no data returned" });
        }
        
        console.log("✅ [Secure Profile API] Profile created successfully:", newProfile.id, newProfile.username);
        return res.status(201).json({ 
            profile: newProfile,
            message: "Profile created successfully" 
        });
        
    } catch (error) {
        console.error("🚨 [Secure Profile API] POST error:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
