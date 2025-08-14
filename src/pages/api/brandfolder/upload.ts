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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("=== BRANDFOLDER RESUMABLE UPLOAD API CALLED ===");

    try {
        const form = formidable({ maxFileSize: 5 * 1024 * 1024 * 1024 }); // 5GB limit

        const [fields, files] = await form.parse(req);
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        const userName = Array.isArray(fields.userName) ? fields.userName[0] : fields.userName;
        const fileName = Array.isArray(fields.fileName) ? fields.fileName[0] : fields.fileName;
        const fileType = Array.isArray(fields.fileType) ? fields.fileType[0] : fields.fileType;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

        if (!file || !userName || !fileName) {
            return res.status(400).json({ error: "Missing required fields: file, userName, or fileName" });
        }

        const brandfolderApiKey = process.env.BF_API_KEY;
        if (!brandfolderApiKey) {
            return res.status(500).json({ error: "Brandfolder API key not configured" });
        }

        const fileBuffer = fs.readFileSync(file.filepath);

        // Step 1: Get normal upload request from Brandfolder
        const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${brandfolderApiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        });

        if (!uploadReq.ok) {
            const errorText = await uploadReq.text();
            return res.status(uploadReq.status).json({ error: "Failed to get upload URL", details: errorText });
        }

        const uploadData = await uploadReq.json();
        const resumableInitUrl = uploadData.upload_url; // Initial upload URL from Brandfolder

        if (!resumableInitUrl) {
            return res.status(500).json({ error: "No resumable init URL in response" });
        }

        // Step 2: Start resumable upload session
        const startResumable = await fetch(resumableInitUrl, {
            method: "POST",
            headers: {
                "x-goog-resumable": "start",
                "Content-Type": fileType || "application/octet-stream"
            }
        });

        if (!startResumable.ok) {
            const errorText = await startResumable.text();
            return res.status(startResumable.status).json({ error: "Failed to start resumable upload", details: errorText });
        }

        const resumableUploadUrl = startResumable.headers.get("location");
        if (!resumableUploadUrl) {
            return res.status(500).json({ error: "Missing resumable upload URL from GCS" });
        }

        console.log("📡 Resumable upload URL:", resumableUploadUrl);

        // Step 3: Upload file in chunks
        const chunkSize = 10 * 1024 * 1024; // 10 MB
        let offset = 0;
        while (offset < fileBuffer.length) {
            const end = Math.min(offset + chunkSize, fileBuffer.length);
            const chunk = fileBuffer.slice(offset, end);
            const contentRange = `bytes ${offset}-${end - 1}/${fileBuffer.length}`;

            console.log(`Uploading chunk: ${contentRange}`);

            const chunkUploadRes = await fetch(resumableUploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Length": chunk.length.toString(),
                    "Content-Range": contentRange
                },
                body: chunk
            });

            if (![200, 201, 308].includes(chunkUploadRes.status)) {
                const errorText = await chunkUploadRes.text();
                return res.status(chunkUploadRes.status).json({ error: "Chunk upload failed", details: errorText });
            }

            offset = end;
        }

        console.log("✅ All chunks uploaded successfully");

        // Step 4: Create Asset in Brandfolder
        const finalDescription = description
            ? `${description} (Uploaded by ${userName})`
            : `User-submitted content by ${userName}`;

        const assetPayload = {
            data: {
                attributes: [
                    {
                        name: `${userName} Upload - ${fileName}`,
                        description: finalDescription,
                        attachments: [
                            {
                                url: uploadData.object_url,
                                filename: fileName
                            }
                        ]
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
            return res.status(createAsset.status).json({ error: "Failed to create asset", details: errorText });
        }

        const assetResult = await createAsset.json();

        // Clean up
        fs.unlinkSync(file.filepath);

        return res.status(200).json({
            success: true,
            message: "File uploaded successfully via resumable upload",
            asset: assetResult
        });

    } catch (error) {
        console.error("💥 UPLOAD ERROR:", error);
        return res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : error });
    }
}
