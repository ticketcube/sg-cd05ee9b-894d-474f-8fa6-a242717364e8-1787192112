
import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Brandfolder configuration
const BRANDFOLDER_ID = "t5mbs6jqqqbqhw8mmqmmn945";
const SECTION_ID = "b73rkvfrhqbbt9hfq93bsw";

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

    console.log("File processed:", { 
      originalName: fileName, 
      sanitizedName: sanitizedFileName, 
      size: fileBuffer.length,
      brandfolderID: BRANDFOLDER_ID,
      sectionID: SECTION_ID
    });

    // Create multipart form data using form-data package
    const FormData = (await import('form-data')).default;
    const uploadForm = new FormData();
    
    // Add the file
    uploadForm.append('file', fileBuffer, {
      filename: sanitizedFileName,
      contentType: fileType || 'application/octet-stream'
    });
    
    // Add asset metadata
    uploadForm.append('name', sanitizedFileName);
    
    const finalDescription = description 
      ? `${description} (Uploaded by ${userName} via OTWChart)`
      : `Uploaded by ${userName} via OTWChart`;
    uploadForm.append('description', finalDescription);

    // Add Brandfolder and Section IDs for proper organization
    uploadForm.append('brandfolder_id', BRANDFOLDER_ID);
    uploadForm.append('section_id', SECTION_ID);

    console.log("Uploading to Brandfolder:", {
      fileName: sanitizedFileName,
      brandfolderId: BRANDFOLDER_ID,
      sectionId: SECTION_ID,
      description: finalDescription
    });

    // Upload to the specific Brandfolder section using the correct endpoint
    const uploadUrl = `https://brandfolder.com/api/v4/brandfolders/${BRANDFOLDER_ID}/sections/${SECTION_ID}/assets`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${brandfolderApiKey}`,
        ...uploadForm.getHeaders(),
      },
      body: uploadForm as any, // Type assertion to bypass TypeScript issue
    });

    console.log("Brandfolder response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Brandfolder upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        url: uploadUrl,
        body: errorText.substring(0, 500) // Log first 500 chars
      });
      
      let errorMessage = "Failed to upload to Brandfolder";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          errorMessage = errorJson.errors.map((err: any) => err.detail || err.title || 'Unknown error').join(', ');
        } else {
          errorMessage = errorJson.message || errorJson.error || `Brandfolder API Error: ${errorJson.errors?.[0]?.detail || 'Unknown error'}`;
        }
      } catch (e) {
        // If not JSON, check for common error patterns
        if (errorText.includes('401') || uploadResponse.status === 401) {
          errorMessage = "Invalid Brandfolder API key";
        } else if (errorText.includes('403') || uploadResponse.status === 403) {
          errorMessage = "Insufficient permissions to upload to Brandfolder";
        } else if (uploadResponse.status === 404) {
          errorMessage = "Brandfolder or Section not found. Please check the configuration.";
        } else {
          errorMessage = `Brandfolder error (${uploadResponse.status}): ${uploadResponse.statusText}`;
        }
      }
      
      return res.status(uploadResponse.status).json({ error: errorMessage });
    }

    const result = await uploadResponse.json();
    console.log("Upload successful:", { 
      assetId: result.data?.id, 
      fileName: sanitizedFileName,
      assetUrl: result.data?.attributes?.cdn_url 
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.warn("Failed to clean up temporary file:", cleanupError);
    }

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to Brandfolder",
      assetId: result.data?.id,
      fileName: sanitizedFileName,
      assetName: result.data?.attributes?.name,
      assetUrl: result.data?.attributes?.cdn_url,
      brandfolderInfo: {
        brandfolderId: BRANDFOLDER_ID,
        sectionId: SECTION_ID
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
