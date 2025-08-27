
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

      // Step 1: Get upload URL from Brandfolder (FIXED: POST with JSON body)
      const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${brandfolderApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: fileName,
          mimetype: fileType
        })
      });

      if (!uploadReq.ok) {
        console.error("❌ Failed to get upload request:", uploadReq.status, uploadReq.statusText);
        return res.status(uploadReq.status).json({ error: "Failed to get upload request" });
      }

      const uploadData = await uploadReq.json();
      const resumableInitUrl = uploadData.upload_url;
      const objectUrl = uploadData.object_url;

      console.log("📋 Upload request data:", { resumableInitUrl, objectUrl });

      // Step 2: Initialize resumable session (FIXED: Remove Content-Length, accept 200/201)
      try {
        const startResumable = await fetch(resumableInitUrl, {
          method: "POST",
          headers: {
            "X-Goog-Resumable": "start",
            "Content-Type": fileType || "application/octet-stream"
          }
        });

        console.log("📡 Resumable init response status:", startResumable.status);
        console.log("📡 Response headers:", Object.fromEntries(startResumable.headers.entries()));

        // FIXED: Accept both 200 and 201 status codes
        if (![200, 201].includes(startResumable.status)) {
          const responseText = await startResumable.text();
          console.error("❌ Unexpected resumable init response:", {
            status: startResumable.status,
            statusText: startResumable.statusText,
            body: responseText,
            headers: Object.fromEntries(startResumable.headers.entries())
          });
          return res.status(500).json({ 
            error: "Failed to initialize resumable upload",
            details: `Expected status 200/201, got ${startResumable.status}: ${responseText}`
          });
        }

        const resumableUploadUrl = startResumable.headers.get("location");

        if (!resumableUploadUrl) {
          console.error("❌ No location header in resumable response");
          console.error("Available headers:", Object.fromEntries(startResumable.headers.entries()));
          return res.status(500).json({ 
            error: "Failed to initialize resumable upload", 
            details: "No location header returned from Google Cloud Storage"
          });
        }

        console.log("✅ Resumable upload session started successfully");
        console.log("📍 Resumable URL:", resumableUploadUrl);
        
        return res.status(200).json({
          resumableUploadUrl,
          objectUrl,
          fileName,
          fileType,
          userName,
          description,
          fileSize
        });

      } catch (resumableError) {
        console.error("💥 Error during resumable session initialization:", resumableError);
        return res.status(500).json({ 
          error: "Failed to initialize resumable upload",
          details: resumableError instanceof Error ? resumableError.message : String(resumableError)
        });
      }
    }

    // 🔍 Check upload status (for resumability)
    if (req.method === "PUT" && action === "status") {
      const { resumableUploadUrl, fileSize } = req.body;

      console.log("🔍 Checking upload status for resumable URL");

      try {
        const statusResponse = await fetch(resumableUploadUrl, {
          method: "PUT",
          headers: { 
            "Content-Range": `bytes */${fileSize}`
          }
        });

        console.log("📊 Status check response:", statusResponse.status);

        // Google Cloud returns 308 Resume Incomplete if partially uploaded
        // or 404/400 if the session is expired/invalid
        if (statusResponse.status === 308) {
          const range = statusResponse.headers.get("range");
          // FIXED: Add +1 for correct byte counting (0-5242879 means 5,242,880 bytes)
          const uploadedBytes = range ? parseInt(range.split("-")[1], 10) + 1 : 0;
          console.log(`📊 Upload status: ${uploadedBytes}/${fileSize} bytes uploaded`);
          return res.json({ uploadedBytes });
        } else if (statusResponse.status === 404 || statusResponse.status === 400) {
          // Session expired or invalid - start from beginning
          console.log("⚠️ Upload session expired, starting from 0");
          return res.json({ uploadedBytes: 0 });
        } else {
          const responseText = await statusResponse.text();
          console.error("❌ Unexpected status response:", {
            status: statusResponse.status,
            body: responseText
          });
          return res.json({ uploadedBytes: 0 });
        }

      } catch (statusError) {
        console.error("💥 Error checking upload status:", statusError);
        // If status check fails, assume starting from beginning
        return res.json({ uploadedBytes: 0 });
      }
    }

    // 2️⃣ Finalize & create asset in Brandfolder
    if (req.method === "POST" && action === "create") {
      const { fileName, userName, description, objectUrl } = req.body;

      console.log("🎯 Creating asset in Brandfolder:", { fileName, userName });

      const finalDescription = description
        ? `${description} (Uploaded by ${userName} via OTWChart)`
        : `User-submitted content by ${userName} via OTWChart`;

      // FIXED: Correct payload structure - attributes as object, not array
      const assetPayload = {
        data: {
          attributes: {
            name: `${userName} Upload - ${fileName}`,
            description: finalDescription,
            attachments: [{ url: objectUrl, filename: fileName }]
          }
        },
        section_key: SECTION_ID
      };

      try {
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

      } catch (createError) {
        console.error("💥 Error creating asset:", createError);
        return res.status(500).json({ 
          error: "Failed to create asset",
          details: createError instanceof Error ? createError.message : String(createError)
        });
      }
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
