
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface BrandfolderAssetResponse {
  data: {
    id: string;
    attributes: {
      name: string;
      url: string;
      cdn_url: string;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const userName = Array.isArray(fields.userName) ? fields.userName[0] : fields.userName;
    const fileName = Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName;
    const fileType = Array.isArray(fields.fileType) ? fields.fileType[0] : fields.fileType;

    if (!file || !userName || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileExtension = fileName.split('.').pop() || '';
    const sanitizedFileName = `${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

    // Get Brandfolder API key from environment
    const brandfolderApiKey = process.env.BF_API_KEY;
    if (!brandfolderApiKey) {
      return res.status(500).json({ error: "Brandfolder API key not configured" });
    }

    // First, create the asset in Brandfolder
    const createAssetResponse = await fetch("https://brandfolder.com/api/v4/assets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${brandfolderApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            name: sanitizedFileName,
            description: `Uploaded by ${userName} via OTWChart`,
          }
        }
      }),
    });

    if (!createAssetResponse.ok) {
      const errorText = await createAssetResponse.text();
      console.error("Brandfolder asset creation failed:", errorText);
      return res.status(500).json({ error: "Failed to create asset in Brandfolder" });
    }

    const assetData: BrandfolderAssetResponse = await createAssetResponse.json() as BrandfolderAssetResponse;
    const assetId = assetData.data.id;

    // Upload the actual file content
    const uploadResponse = await fetch(`https://brandfolder.com/api/v4/assets/${assetId}/attachments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${brandfolderApiKey}`,
        "Content-Type": fileType || "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Brandfolder file upload failed:", errorText);
      return res.status(500).json({ error: "Failed to upload file to Brandfolder" });
    }

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to Brandfolder",
      assetId: assetId,
      fileName: sanitizedFileName
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
