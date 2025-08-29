import type { NextApiRequest, NextApiResponse } from "next";

// Proxy chunk upload to Brandfolder signed URL
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { url, start, end, total, chunk } = req.body;

        // Forward the chunk to Brandfolder
        const bfRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Length": `${chunk.length}`,
                "Content-Range": `bytes ${start}-${end - 1}/${total}`,
            },
            body: Buffer.from(chunk, "base64"), // frontend must send base64
        });

        const text = await bfRes.text();

        res.status(bfRes.status).json({ status: bfRes.status, response: text });
    } catch (err: any) {
        console.error("Proxy upload error:", err);
        res.status(500).json({ error: "Upload failed", details: err.message });
    }
}
