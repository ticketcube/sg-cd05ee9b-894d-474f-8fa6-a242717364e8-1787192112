
import type { NextApiRequest, NextApiResponse } from "next";

const BRANDFOLDER_ID = process.env.BRANDFOLDER_ID!;
const SECTION_ID = process.env.BRANDFOLDER_SECTION_ID!;
const BF_API_KEY = process.env.BF_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { filename, filesize, mimetype } = req.body;

    try {
        const bfRes = await fetch("https://brandfolder.com/api/v2/upload_sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.BF_API_KEY}`, // 🔑 Secure in env
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                brandfolder_id: BRAND_FOLDER_ID,
                section_id: SECTION_ID,
                filename: fileName,
                file_size: fileSize,
                mimetype: fileType || "application/octet-stream",
                resumable: true,
            }),
        });

        // ⛔ Don’t assume JSON — check content type
        const contentType = initRes.headers.get("content-type");
        if (!initRes.ok) {
            const errText = await initRes.text();
            console.error("❌ Brandfolder init failed:", initRes.status, errText);
            return res.status(initRes.status).json({ error: errText });
        }

        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await initRes.json();
        } else {
            const rawText = await initRes.text();
            console.warn("⚠️ Non-JSON response from Brandfolder:", rawText);
            return res.status(500).json({ error: "Brandfolder returned non-JSON response" });
        }

        return res.status(200).json({ resumableUploadUrl: data.upload_url });
    } catch (error: any) {
        console.error("❌ Upload init error:", error);
        return res.status(500).json({ error: error.message || "Unexpected error" });
    }
}

if (req.method === "PUT" && req.query.action === "status") {
    try {
        const { resumableUploadUrl, fileSize } = req.body;

        const statusRes = await fetch(resumableUploadUrl, {
            method: "PUT",
            headers: {
                "Content-Range": `bytes */${fileSize}`,
            },
        });

        if (statusRes.status === 308) {
            const range = statusRes.headers.get("Range");
            let uploadedBytes = 0;
            if (range) {
                const match = range.match(/bytes=0-(\d+)/);
                if (match) uploadedBytes = parseInt(match[1], 10) + 1;
            }
            return res.status(200).json({ uploadedBytes });
        }

        return res.status(statusRes.status).json({ error: await statusRes.text() });
    } catch (error: any) {
        console.error("❌ Status check error:", error);
        return res.status(500).json({ error: error.message || "Unexpected error" });
    }


return res.status(405).json({ error: "Method not allowed" });
}
