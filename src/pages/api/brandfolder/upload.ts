
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

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
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

    console.log("Upload request received:", { userName, fileName, fileType, hasFile: !!file });

    if (!file || !userName || !fileName) {
      console.error("Missing required fields:", { file: !!file, userName: !!userName, fileName: !!fileName });
      return res.status(400).json({ error: "Missing required fields: file, userName, or fileName" });
    }

    // Get Brandfolder API key from environment
    const brandfolderApiKey = process.env.BF_API_KEY;
    if (!brandfolderApiKey) {
      console.error("Brandfolder API key not configured");
      return res.status(500).json({ error: "Brandfolder API key not configured" });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileExtension = fileName.split('.').pop() || '';
    const sanitizedFileName = `${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExtension}`;

    console.log("File processed:", { originalName: fileName, sanitizedName: sanitizedFileName, size: fileBuffer.length });

    // Try a simpler approach - upload directly using multipart/form-data
    const FormData = (await import('form-data')).default;
    const uploadForm = new FormData();
    uploadForm.append('file', fileBuffer, {
      filename: sanitizedFileName,
      contentType: fileType || 'application/octet-stream'
    });
    uploadForm.append('name', sanitizedFileName);
    if (description) {
      uploadForm.append('description', `${description} (Uploaded by ${userName} via OTWChart)`);
    } else {
      uploadForm.append('description', `Uploaded by ${userName} via OTWChart`);
    }

    // Use the simpler assets endpoint for direct upload
    const uploadResponse = await fetch("https://brandfolder.com/api/v4/assets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${brandfolderApiKey}`,
        ...uploadForm.getHeaders(),
      },
      body: uploadForm,
    });

    console.log("Brandfolder response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Brandfolder upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: errorText
      });
      
      let errorMessage = "Failed to upload to Brandfolder";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        // If not JSON, use the status text
        errorMessage = `Brandfolder error (${uploadResponse.status}): ${uploadResponse.statusText}`;
      }
      
      return res.status(uploadResponse.status).json({ error: errorMessage });
    }

    const result = await uploadResponse.json();
    console.log("Upload successful:", { assetId: result.data?.id, fileName: sanitizedFileName });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to Brandfolder",
      assetId: result.data?.id,
      fileName: sanitizedFileName,
      result: result
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
