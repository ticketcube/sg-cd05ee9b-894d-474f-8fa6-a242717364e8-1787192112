// pages/api/brandfolder/upload.ts
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
      const { fileName, fileType, userName, description } = req.body;

      const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${brandfolderApiKey}`,
          Accept: "application/json"
        }
      });

      if (!uploadReq.ok) {
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
          "Content-Type": fileType
        }
      });

      const resumableUploadUrl = startResumable.headers.get("location");

      return res.status(200).json({
        resumableUploadUrl,
        objectUrl,
        fileName,
        fileType,
        userName,
        description
      });
    }

    // 2️⃣ Finalize & create asset in Brandfolder
    if (req.method === "POST" && action === "create") {
      const { fileName, userName, description, objectUrl } = req.body;

      const assetPayload = {
        data: {
          attributes: [
            {
              name: `${userName} Upload - ${fileName}`,
              description: description || `User-submitted content by ${userName}`,
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
        return res.status(createAsset.status).json({ error: "Failed to create asset" });
      }

      const assetResult = await createAsset.json();
      return res.status(200).json({ success: true, asset: assetResult });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
