// pages/api/brandfolder/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Load from environment
const BF_API_KEY = process.env.BF_API_KEY as string;
const BRAND_FOLDER_ID = process.env.BRANDFOLDER_ID as string;
const SECTION_ID = process.env.BRANDFOLDER_SECTION_ID as string;

// In-memory session store for resumable uploads
type UploadSession = {
    sessionUrl: string; // GCS resumable upload URL
    objectUrl: string;  // Brandfolder object URL
    filename: string;
    contentType: string;
};
const uploadSessions = new Map < string, UploadSession> ();

export const config = {
    api: {
        bodyParser: false // We handle our own parsing for binary chunks
    }
};

// Helper to read JSON body when bodyParser is disabled
async function readJson<T = any>(req: NextApiRequest): Promise<T> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const action = req.query.action;

    try {
        if (action === 'initiate' && req.method === 'POST') {
            const { filename, contentType } = await readJson < { filename: string; contentType: string } > (req);

            if (!filename || !contentType) {
                return res.status(400).json({ error: 'Missing filename or contentType' });
            }

            const bfResp = await fetch('https://brandfolder.com/api/v4/upload_requests', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${BF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    brandfolder_id: BRAND_FOLDER_ID,
                    section_id: SECTION_ID,
                    filename,
                    content_type: contentType
                })
            });

            if (!bfResp.ok) {
                const text = await bfResp.text();
                return res.status(bfResp.status).json({ error: `Brandfolder init failed: ${text}` });
            }

            const bfData = await bfResp.json();
            const uploadId = uuidv4();

            uploadSessions.set(uploadId, {
                sessionUrl: bfData.upload_url,
                objectUrl: bfData.object_url,
                filename,
                contentType
            });

            return res.status(200).json({ uploadId });
        }

        if (action === 'chunk' && req.method === 'PUT') {
            const uploadId = req.query.uploadId as string;
            const session = uploadSessions.get(uploadId);
            if (!session) return res.status(404).json({ error: 'Upload session not found' });

            const start = Number(req.headers['x-upload-offset-start']);
            const end = Number(req.headers['x-upload-offset-end']);
            const total = Number(req.headers['x-upload-total']);

            if (isNaN(start) || isNaN(end) || isNaN(total)) {
                return res.status(400).json({ error: 'Invalid chunk headers' });
            }

            const gcsResp = await fetch(session.sessionUrl, {
                method: 'PUT',
                headers: {
                    'Content-Length': String(end - start + 1),
                    'Content-Range': `bytes ${start}-${end}/${total}`,
                    'Content-Type': session.contentType
                },
                body: req // Stream chunk
            });

            res.status(gcsResp.status);
            gcsResp.headers.forEach((value, key) => res.setHeader(key, value));
            gcsResp.body?.pipe(res);
            return;
        }

        if (action === 'status' && req.method === 'POST') {
            const { uploadId, total } = await readJson < { uploadId: string; total: number } > (req);
            const session = uploadSessions.get(uploadId);
            if (!session) return res.status(404).json({ error: 'Upload session not found' });

            const probeResp = await fetch(session.sessionUrl, {
                method: 'PUT',
                headers: {
                    'Content-Range': `bytes */${total}`,
                    'Content-Type': session.contentType
                }
            });

            const range = probeResp.headers.get('range') || probeResp.headers.get('Range');
            let uploaded = 0;
            if (range) {
                const endByte = parseInt(range.split('-')[1], 10);
                uploaded = endByte + 1;
            }
            return res.status(200).json({ uploaded });
        }

        if (action === 'complete' && req.method === 'POST') {
            const { uploadId } = await readJson < { uploadId: string } > (req);
            const session = uploadSessions.get(uploadId);
            if (!session) return res.status(404).json({ error: 'Upload session not found' });

            const assetResp = await fetch('https://brandfolder.com/api/v5/assets', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${BF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    object_url: session.objectUrl,
                    name: session.filename,
                    section_id: SECTION_ID
                })
            });

            if (!assetResp.ok) {
                const text = await assetResp.text();
                return res.status(assetResp.status).json({ error: `Asset creation failed: ${text}` });
            }

            const assetData = await assetResp.json();
            uploadSessions.delete(uploadId);
            return res.status(200).json({ asset: assetData });
        }

        return res.status(400).json({ error: 'Invalid action or method' });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
