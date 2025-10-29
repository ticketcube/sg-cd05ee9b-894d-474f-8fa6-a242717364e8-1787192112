import { NextApiRequest, NextApiResponse } from "next";
import formidable, { Fields, Files } from "formidable";
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

const BF_API_KEY = process.env.BF_API_KEY!;
const BRANDFOLDER_ID = process.env.BRANDFOLDER_ID!;
const SECTION_ID = process.env.SECTION_ID!;

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
    const form = formidable({ maxFileSize: MAX_FILE_SIZE });
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { fields, files } = await parseForm(req);

        const getField = (f: string | string[] | undefined, def = "") =>
            Array.isArray(f) ? f[0] : f ?? def;

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        const userName = getField(fields.userName, "Anonymous");
        const fileName = getField(fields.fileName, "Untitled");
        const fileType = getField(fields.fileType, "application/octet-stream");
        const description = getField(fields.description, "");

        if (!file || !userName || !fileName) {
            return res.status(400).json({ error: "Missing required fields: file, userName, fileName" });
        }

        const fileBuffer = await fs.promises.readFile(file.filepath);

        // Step 1: Get upload URL
        const uploadReq = await fetch("https://brandfolder.com/api/v4/upload_requests", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BF_API_KEY}`,
            },

        });

        if (!uploadReq.ok) {
            const text = await uploadReq.text();
            return res.status(uploadReq.status).json({ error: `Upload request failed: ${text}` });
        }

        const { upload_url: uploadUrl, object_url: objectUrl } = await uploadReq.json();

        if (!uploadUrl || !objectUrl) {
            return res.status(500).json({ error: "Invalid upload request response" });
        }

        // Step 2: Upload file binary to storage
        const storageUpload = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": fileType },
            body: new Uint8Array(fileBuffer),
        });

        if (!storageUpload.ok) {
            const text = await storageUpload.text();
            return res.status(storageUpload.status).json({ error: `Failed to upload file: ${text}` });
        }

        // Step 3: Create asset record in Brandfolder
        const finalDescription = description
            ? `${description} (Uploaded by ${userName})`
            : `Uploaded by ${userName}`;

        const assetPayload = {
            data: {
                attributes: [
                    {
                        name: `${userName} Upload - ${fileName}`,
                        description: finalDescription,
                        attachments: [{ url: objectUrl, filename: fileName }],
                    },
                ],
            },
            section_key: SECTION_ID, // Some accounts need section_key instead of section_id
        };

        const createAsset = await fetch(
            `https://brandfolder.com/api/v4/brandfolders/${BRANDFOLDER_ID}/assets`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${BF_API_KEY}`,
                },
                body: JSON.stringify(assetPayload),
            }
        );

        if (!createAsset.ok) {
            const errorText = await createAsset.text();
            return res.status(createAsset.status).json({ error: errorText });
        }

        const assetResult = await createAsset.json();
        await fs.promises.unlink(file.filepath); // cleanup temp file

        return res.status(200).json({ success: true, asset: assetResult });
    } catch (err: any) {
        console.error("Upload error:", err);
        return res.status(500).json({ error: err.message || "Server error" });
    }
}
