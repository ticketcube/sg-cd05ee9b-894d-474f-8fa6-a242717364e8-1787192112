
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

    console.log("File processed:", { 
      originalName: fileName, 
      size: fileBuffer.length,
      brandfolderID: BRANDFOLDER_ID,
      sectionID: SECTION_ID
    });

    // Step 1: Get upload URL from Brandfolder
    console.log("Step 1: Getting upload URL from Brandfolder...");
    const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${brandfolderApiKey}`
      }
    });

    if (!uploadReq.ok) {
      const errorText = await uploadReq.text();
      console.error("Failed to get upload URL:", uploadReq.status, errorText);
      return res.status(uploadReq.status).json({ 
        error: `Failed to get upload URL: ${uploadReq.statusText}` 
      });
    }

    const uploadData = await uploadReq.json();
    const uploadUrl = uploadData.data.attributes.upload_url;
    const objectUrl = uploadData.data.attributes.object_url;

    console.log("Step 1 complete: Got upload URL");

    // Step 2: Upload file to Brandfolder's storage
    console.log("Step 2: Uploading file to Brandfolder storage...");
    const storageUpload = await fetch(uploadUrl, {
      method: "PUT",
      headers: { 
        "Content-Type": fileType || 'application/octet-stream'
      },
      body: fileBuffer
    });

    if (!storageUpload.ok) {
      const errorText = await storageUpload.text();
      console.error("Failed to upload to storage:", storageUpload.status, errorText);
      return res.status(storageUpload.status).json({ 
        error: `Failed to upload file to storage: ${storageUpload.statusText}` 
      });
    }

    console.log("Step 2 complete: File uploaded to storage");

    // Step 3: Create Asset in Brandfolder
    console.log("Step 3: Creating asset record in Brandfolder...");
    const finalDescription = description 
      ? `${description} (Uploaded by ${userName} via OTWChart)`
      : `User-submitted content by ${userName} via OTWChart`;

    const createAsset = await fetch(
      `https://brandfolder.com/api/v4/brandfolders/${BRANDFOLDER_ID}/assets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${brandfolderApiKey}`
        },
        body: JSON.stringify({
          data: {
            attributes: {
              name: `${userName} Upload - ${fileName}`,
              description: finalDescription,
              attachments: [
                {
                  url: objectUrl,
                  filename: fileName
                }
              ]
            }
          },
          section_id: SECTION_ID
        })
      }
    );

    if (!createAsset.ok) {
      const errorText = await createAsset.text();
      console.error("Failed to create asset:", createAsset.status, errorText);
      
      let errorMessage = "Failed to create asset in Brandfolder";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && Array.isArray(errorJson.errors)) {
          errorMessage = errorJson.errors.map((err: any) => err.detail || err.title || 'Unknown error').join(', ');
        } else {
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        }
      } catch (e) {
        errorMessage = `Brandfolder error (${createAsset.status}): ${createAsset.statusText}`;
      }
      
      return res.status(createAsset.status).json({ error: errorMessage });
    }

    const assetResult = await createAsset.json();
    console.log("Step 3 complete: Asset created successfully");

    console.log("Upload successful:", { 
      assetId: assetResult.data?.id, 
      fileName: fileName,
      assetUrl: assetResult.data?.attributes?.cdn_url 
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
      asset: assetResult,
      assetId: assetResult.data?.id,
      fileName: fileName,
      assetName: assetResult.data?.attributes?.name,
      assetUrl: assetResult.data?.attributes?.cdn_url,
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
