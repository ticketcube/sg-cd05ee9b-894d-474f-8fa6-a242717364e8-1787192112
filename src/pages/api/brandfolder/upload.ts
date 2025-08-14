import { NextApiRequest, NextApiResponse } from "next";

const BRANDFOLDER_ID = "t5mbs6jqqqbqhw8mmqmmn945";
const SECTION_ID = "b73rkvfrhqbbt9hfq93bsw";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const brandfolderApiKey = process.env.BF_API_KEY;
    if (!brandfolderApiKey) {
        return res.status(500).json({ error: "Brandfolder API key not configured" });
    }

    try {
        const action = req.query.action;

        if (req.method === "POST" && action === "start") {
            const { fileType } = req.body;
            if (!fileType) return res.status(400).json({ error: "Missing fileType" });

            // 1️⃣ Get upload request from Brandfolder
            const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${brandfolderApiKey}`,
                    Accept: "application/json",
                },
            });
            const uploadData = await uploadReq.json();
            const resumableInitUrl = uploadData.upload_url;
            const objectUrl = uploadData.object_url;

            // 2️⃣ Start resumable session
            const startResumable = await fetch(resumableInitUrl, {
                method: "POST",
                headers: {
                    "x-goog-resumable": "start",
                    "Content-Type": fileType,
                },
            });
            const resumableUploadUrl = startResumable.headers.get("location");

            if (!resumableUploadUrl) {
                return res.status(500).json({ error: "Failed to start resumable upload" });
            }

            return res.status(200).json({
                resumableUploadUrl,
                objectUrl,
                brandfolderId: BRANDFOLDER_ID,
                sectionId: SECTION_ID,
            });
        }

        if (req.method === "POST" && action === "create") {
            const { objectUrl, fileName } = req.body;
            if (!objectUrl || !fileName) {
                return res.status(400).json({ error: "Missing objectUrl or fileName" });
            }

            // 3️⃣ Create the asset in Brandfolder
            const assetPayload = {
                data: {
                    attributes: [
                        {
                            name: `Upload - ${fileName}`,
                            attachments: [{ url: objectUrl, filename: fileName }],
                        },
                    ],
                },
                section_key: SECTION_ID,
            };

            const createAsset = await fetch(
                `https://brandfolder.com/api/v4/brandfolders/${BRANDFOLDER_ID}/assets`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${brandfolderApiKey}`,
                    },
                    body: JSON.stringify(assetPayload),
                }
            );

            const assetResult = await createAsset.json();
            return res.status(200).json({ success: true, asset: assetResult });
        }

        return res.status(400).json({ error: "Invalid action or method" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error", details: err });
    }
}
