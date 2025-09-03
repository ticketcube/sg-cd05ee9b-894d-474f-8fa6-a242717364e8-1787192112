
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
        return handleUpdateProfile(req, res);
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}

async function handleGetProfile(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Accept both user_id and auth_id for backward compatibility
        const user_id = req.query.user_id || req.query.auth_id;
        
        if (!user_id || typeof user_id !== "string") {
            return res.status(400).json({ error: "user_id is required" });
        }
        
        console.log("🔍 [Secure Profile API] Looking up profile for user_id:", user_id);
        
        // Use admin client to query user profile with user_id column
        const { data: profile, error } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .single();
        
        if (error) {
            if (error.code === "PGRST116") {
                console.log("⚠️ [Secure Profile API] Profile not found for user_id:", user_id);
                return res.status(404).json({ error: "Profile not found" });
            }
            console.error("❌ [Secure Profile API] Database error:", error);
            return res.status(500).json({ error: "Database error", details: error.message });
        }
        
        if (!profile) {
            console.log("⚠️ [Secure Profile API] No profile returned for user_id:", user_id);
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

async function handleUpdateProfile(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Accept both user_id and auth_id for backward compatibility
        const user_id = req.body.user_id || req.body.auth_id;
        const { username, email, city, role } = req.body;
        
        console.log("🔍 [Secure Profile API] Updating profile with data:", { user_id, username, email, city, role });
        
        if (!user_id) {
            return res.status(400).json({ error: "user_id is required" });
        }
        
        // Check if profile exists (it should, thanks to the database trigger)
        const { data: existingProfile, error: checkError } = await supabaseAdmin
            .from("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .single();
        
        if (checkError) {
            if (checkError.code === "PGRST116") {
                console.error("❌ [Secure Profile API] Profile not found for user_id:", user_id);
                return res.status(404).json({ 
                    error: "Profile not found", 
                    details: "Profile should have been created automatically. Please contact support." 
                });
            }
            console.error("❌ [Secure Profile API] Error checking existing profile:", checkError);
            return res.status(500).json({ error: "Database error during profile check" });
        }
        
        if (!existingProfile) {
            console.error("❌ [Secure Profile API] No profile found for user_id:", user_id);
            return res.status(404).json({ 
                error: "Profile not found", 
                details: "Profile should have been created automatically. Please contact support." 
            });
        }
        
        console.log("✅ [Secure Profile API] Found existing profile:", existingProfile.id, existingProfile.username);
        
        // Handle city lookup if provided
        let cityId: number | null = existingProfile.city_id;
        if (city && city.trim()) {
            const { data: cityData } = await supabaseAdmin
                .from("city_latlong")
                .select("id")
                .eq("normalized_name", city.trim().toLowerCase())
                .single();
            
            cityId = cityData?.id || null;
        }
        
        console.log("🏙️ [Secure Profile API] City lookup result:", { city, cityId });
        
        // Prepare update data - only update fields that are provided
        const updateData: any = {};
        
        if (username && username.trim()) {
            updateData.username = username.trim();
        }
        if (email && email.trim()) {
            updateData.email = email.trim();
        }
        if (city !== undefined) {
            updateData.city_id = cityId;
            updateData.raw_city_input = city?.trim() || null;
        }
        if (role !== undefined) {
            updateData.role = role;
        }
        
        // If no update data provided, just return the existing profile
        if (Object.keys(updateData).length === 0) {
            console.log("ℹ️ [Secure Profile API] No update data provided, returning existing profile");
            return res.status(200).json({ 
                profile: existingProfile,
                message: "No updates needed" 
            });
        }
        
        console.log("💾 [Secure Profile API] Updating profile with data:", updateData);
        
        // Update the profile
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from("user_profiles")
            .update(updateData)
            .eq("user_id", user_id)
            .select("*")
            .single();
        
        if (updateError) {
            console.error("❌ [Secure Profile API] Update error:", updateError);
            return res.status(500).json({ 
                error: "Failed to update profile", 
                details: updateError.message 
            });
        }
        
        if (!updatedProfile) {
            console.error("❌ [Secure Profile API] No profile returned after update");
            return res.status(500).json({ error: "Profile update failed - no data returned" });
        }
        
        console.log("✅ [Secure Profile API] Profile updated successfully:", updatedProfile.id, updatedProfile.username);
        return res.status(200).json({ 
            profile: updatedProfile,
            message: "Profile updated successfully" 
        });
        
    } catch (error) {
        console.error("🚨 [Secure Profile API] POST error:", error);
        return res.status(500).json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
}
