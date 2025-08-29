
import { NextApiRequest, NextApiResponse } from "next";
import BrandfolderUpload from "@/lib/brandfolder-upload";

const BRANDFOLDER_ID = "t5mbs6jqqqbqhw8mmqmmn945";
const SECTION_ID = "b73rkvfrhqbbt9hfq93bsw";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "POST") {
            const { fileName, fileType, description } = req.body;
            const uploader = new BrandfolderUpload({ file: new Blob(), fileName, fileType, description });

            const uploadUrl = await uploader.startResumableUpload();
            return res.status(200).json({ resumableUploadUrl: uploadUrl });
        }

        if (req.method === "PUT") {
            const { resumableUploadUrl, chunk } = req.body;

            // The API route just proxies the chunk
            const bfRes = await fetch(resumableUploadUrl, {
                method: "PUT",
                headers: { "Content-Range": req.headers["content-range"] || "", "Content-Type": chunk.type },
                body: Buffer.from(chunk.data),
            });

            if (!bfRes.ok && bfRes.status !== 308) {
                const errText = await bfRes.text();
                return res.status(bfRes.status).json({ error: errText });
            }

            return res.status(bfRes.status).json({ status: bfRes.status });
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (err: any) {
        console.error("API error:", err);
        res.status(500).json({ error: err.message || "Unexpected error" });
    }
}
