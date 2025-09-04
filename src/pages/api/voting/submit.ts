
import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract and verify the Supabase auth token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const { data: { user }, error: sessionError } = await supabaseAdmin.auth.getUser(token);

    if (sessionError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Process the voting request
    const { data, error } = await supabaseAdmin
      .from("weekly_votes")
      .insert({
        user_id: user.id,
        // Add other required fields from req.body
        ...req.body
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Voting API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}