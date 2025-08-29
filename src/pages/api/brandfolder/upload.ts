
import { NextApiRequest, NextApiResponse } from "next";

const BRANDFOLDER_ID = "t5mbs6jqqqbqhw8mmqmmn945";
const SECTION_ID = "b73rkvfrhqbbt9hfq93bsw";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "POST") {
            const initRes = await fetch("https://api.brandfolder.com/v2/resumable_uploads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.BF_API_KEY}`,
                },
                body: JSON.stringify(req.body),
            });

            const data = await initRes.json();
            return res.status(200).json({ resumableUploadUrl: data.upload_url });
        }

        if (req.method === "PUT") {
            const uploadUrl = req.query.uploadUrl as string;
            if (!uploadUrl) return res.status(400).json({ error: "Missing uploadUrl" });

            const chunks: Uint8Array[] = [];
            req.on("data", chunk => chunks.push(chunk));
            req.on("end", async () => {
                const buffer = Buffer.concat(chunks);
                const bfRes = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Range": req.headers["content-range"] || "" },
                    body: buffer,
                });

                if (!bfRes.ok && bfRes.status !== 308) {
                    const errText = await bfRes.text();
                    return res.status(bfRes.status).json({ error: errText });
                }

                return res.status(bfRes.status).json({ status: bfRes.status });
            });
            return;
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("API error:", err);
        res.status(500).json({ error: err.message || "Unexpected error" });
    }
}
