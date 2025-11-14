import type { NextApiRequest, NextApiResponse } from "next";
import { brevoEmailService } from "@/lib/brevoEmailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, unsubscribeToken } = req.body;

  if (!email || !unsubscribeToken) {
    return res.status(400).json({ 
      message: "Email and unsubscribeToken are required" 
    });
  }

  try {
    const result = await brevoEmailService.sendWelcomeEmail(email, unsubscribeToken);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: "Welcome email sent successfully" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send welcome email",
        error: result.error 
      });
    }
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
