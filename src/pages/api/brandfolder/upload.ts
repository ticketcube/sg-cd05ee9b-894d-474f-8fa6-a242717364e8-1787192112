import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { filename, filesize, mimetype } = req.body;

    try {
        const bfRes = await fetch("https://brandfolder.com/api/v2/upload_sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.BRANDFOLDER_API_KEY}`, // 🔑 Secure in env
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                brandfolder_id: process.env.BRANDFOLDER_ID,       // 👈 here
                section_id: process.env.BRANDFOLDER_SECTION_ID,   // 👈 here
                filename,
                filesize,
                mimetype,
            }),
        });

        const data = await bfRes.json();
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
