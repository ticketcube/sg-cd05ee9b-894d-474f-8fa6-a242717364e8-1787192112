
import { NextApiRequest, NextApiResponse } from "next";

const BRANDFOLDER_ID = "t5mbs6jqqqbqhw8mmqmmn945";
const SECTION_ID = "b73rkvfrhqbbt9hfq93bsw";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const brandfolderApiKey = process.env.BF_API_KEY;
  if (!brandfolderApiKey) {
    return res.status(500).json({ error: "Brandfolder API key not configured" });
  }

  try {
    const { action } = req.query;

    // 1️⃣ Start resumable upload session
    if (req.method === "POST" && action === "start") {
      const { fileName, fileType, userName, description, fileSize } = req.body;

      console.log("🚀 Starting resumable upload session:", { fileName, fileType, userName, fileSize });

      const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${brandfolderApiKey}`,
          Accept: "application/json"
        }
      });

      if (!uploadReq.ok) {
        console.error("❌ Failed to get upload request:", uploadReq.status, uploadReq.statusText);
        return res.status(uploadReq.status).json({ error: "Failed to get upload request" });
      }

      const uploadData = await uploadReq.json();
      const resumableInitUrl = uploadData.upload_url;
      const objectUrl = uploadData.object_url;

      // Start resumable session
      const startResumable = await fetch(resumableInitUrl, {
        method: "POST",
        headers: {
          "x-goog-resumable": "start",
          "Content-Type": fileType || "application/octet-stream"
        }
      });

      const resumableUploadUrl = startResumable.headers.get("location");

      if (!resumableUploadUrl) {
        console.error("❌ Failed to get resumable upload URL");
        return res.status(500).json({ error: "Failed to initialize resumable upload" });
      }

      console.log("✅ Resumable upload session started successfully");
      return res.status(200).json({
        resumableUploadUrl,
        objectUrl,
        fileName,
        fileType,
        userName,
        description,
        fileSize
      });
    }

    // 🔍 Check upload status (for resumability)
    if (req.method === "PUT" && action === "status") {
      const { resumableUploadUrl, fileSize } = req.body;

      console.log("🔍 Checking upload status for resumable URL");

      const statusResponse = await fetch(resumableUploadUrl, {
        method: "PUT",
        headers: { 
          "Content-Range": `bytes */${fileSize}` 
        }
      });

      const range = statusResponse.headers.get("range");
      const uploadedBytes = range ? parseInt(range.split("-")[1], 10) + 1 : 0;

      console.log(`📊 Upload status: ${uploadedBytes}/${fileSize} bytes uploaded`);
      return res.json({ uploadedBytes });
    }

    // 2️⃣ Finalize & create asset in Brandfolder
    if (req.method === "POST" && action === "create") {
      const { fileName, userName, description, objectUrl } = req.body;

      console.log("🎯 Creating asset in Brandfolder:", { fileName, userName });

      const finalDescription = description
        ? `${description} (Uploaded by ${userName} via OTWChart)`
        : `User-submitted content by ${userName} via OTWChart`;

      const assetPayload = {
        data: {
          attributes: [
            {
              name: `${userName} Upload - ${fileName}`,
              description: finalDescription,
              attachments: [{ url: objectUrl, filename: fileName }]
            }
          ]
        },
        section_key: SECTION_ID
      };

      const createAsset = await fetch(
        `https://brandfolder.com/api/v4/brandfolders/${BRANDFOLDER_ID}/assets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${brandfolderApiKey}`
          },
          body: JSON.stringify(assetPayload)
        }
      );

      if (!createAsset.ok) {
        const errorText = await createAsset.text();
        console.error("❌ Failed to create asset:", createAsset.status, errorText);
        
        let errorMessage = "Failed to create asset in Brandfolder";
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            errorMessage = errorJson.errors.map((err: any) => err.detail || err.title || 'Unknown error').join(', ');
          }
        } catch (e) {
          errorMessage = `Brandfolder error (${createAsset.status}): ${createAsset.statusText}`;
        }
        
        return res.status(createAsset.status).json({ error: errorMessage });
      }

      const assetResult = await createAsset.json();
      console.log("✅ Asset created successfully:", assetResult.data?.id);
      
      return res.status(200).json({ 
        success: true, 
        asset: assetResult,
        assetId: assetResult.data?.id,
        fileName: fileName,
        assetName: assetResult.data?.attributes?.name,
        assetUrl: assetResult.data?.attributes?.cdn_url
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("💥 Upload API error:", err);
    return res.status(500).json({ 
      error: "Server error", 
      details: err instanceof Error ? err.message : String(err) 
    });
  }
}
