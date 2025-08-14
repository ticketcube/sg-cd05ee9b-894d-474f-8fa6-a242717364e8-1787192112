// src/pages/api/brandfolder/upload.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT, jwtVerify } from 'jose';
import { Readable } from 'stream';
import { request as httpsRequest } from 'https';
import { URL } from 'url';

export const config = {
    api: { bodyParser: false }, // important for streaming binary chunks
};

// === ENVIRONMENT VARS ===
const BF_API_KEY = process.env.BF_API_KEY!;
const DEFAULT_BRANDFOLDER_ID = process.env.BRANDFOLDER_ID!;
const DEFAULT_SECTION_ID = process.env.SECTION_ID!;
const JWT_SECRET = new TextEncoder().encode(process.env.BRANDFOLDER_JWT_SECRET!);
const MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024; // 15 GB

// === TYPES ===
interface UploadJWTData {
    v: number;
    sessionUrl: string;
    objectUrl: string;
    fileName: string;
    contentType: string;
}

// === UTILS ===
async function signUploadJWT(data: UploadJWTData) {
    return await new SignJWT(data as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
}

async function verifyUploadJWT(token: string): Promise<UploadJWTData> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as any as UploadJWTData;
}

async function json(res: NextApiResponse, status: number, data: any) {
    res.status(status).json(data);
}

// === MAIN HANDLER ===
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const action = req.query.action as string;

    try {
        if (req.method === 'POST' && action === 'initiate') {
            return await initiateUpload(req, res);
        }
        if (req.method === 'PUT' && action === 'chunk') {
            return await uploadChunk(req, res);
        }
        if (req.method === 'POST' && action === 'status') {
            return await getStatus(req, res);
        }
        if (req.method === 'POST' && action === 'complete') {
            return await completeUpload(req, res);
        }

        return json(res, 400, { error: 'Invalid route or method' });
    } catch (err: any) {
        console.error(err);
        return json(res, 500, { error: err.message || 'Internal server error' });
    }
}

// === STEP 1: INITIATE ===
async function initiateUpload(req: NextApiRequest, res: NextApiResponse) {
    const { fileName, contentType, brandfolderId, sectionId } = req.body || {};

    if (!fileName || !contentType) {
        return json(res, 400, { error: 'Missing fileName or contentType' });
    }

    // 1) Get upload_request from Brandfolder
    const bfId = brandfolderId || DEFAULT_BRANDFOLDER_ID;
    const secId = sectionId || DEFAULT_SECTION_ID;

    const uploadReqResp = await fetch('https://brandfolder.com/api/v4/upload_requests', {
        headers: { Authorization: `Bearer ${BF_API_KEY}` },
    });
    if (!uploadReqResp.ok) {
        throw new Error(`Brandfolder upload_requests failed: ${await uploadReqResp.text()}`);
    }
    const uploadReqData = await uploadReqResp.json();
    const { resumable_upload_url, object_url } = uploadReqData;

    // 2) Initiate GCS session
    const gcsResp = await fetch(resumable_upload_url, {
        method: 'POST',
        headers: {
            'x-goog-resumable': 'start',
            'Content-Type': contentType,
        },
    });
    if (!gcsResp.ok) {
        throw new Error(`GCS start failed: ${await gcsResp.text()}`);
    }
    const sessionUrl = gcsResp.headers.get('Location');
    if (!sessionUrl) throw new Error('No session URL returned from GCS');

    // 3) Return signed uploadId
    const uploadId = await signUploadJWT({
        v: 1,
        sessionUrl,
        objectUrl: object_url,
        fileName,
        contentType,
    });

    return json(res, 200, {
        uploadId,
        brandfolderId: bfId,
        sectionId: secId,
    });
}

// === STEP 2: CHUNK UPLOAD ===
async function uploadChunk(req: NextApiRequest, res: NextApiResponse) {
    const uploadId = req.query.uploadId as string;
    if (!uploadId) return json(res, 400, { error: 'Missing uploadId' });

    const { sessionUrl, contentType } = await verifyUploadJWT(uploadId);

    const start = parseInt(req.headers['x-upload-offset-start'] as string, 10);
    const end = parseInt(req.headers['x-upload-offset-end'] as string, 10);
    const total = parseInt(req.headers['x-upload-total'] as string, 10);

    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(total)) {
        return json(res, 400, { error: 'Missing or invalid offset headers' });
    }
    if (total > MAX_FILE_SIZE) {
        return json(res, 400, { error: 'File too large (max 15GB)' });
    }

    // Stream directly to GCS
    const gcsUrl = new URL(sessionUrl);
    const options = {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'Content-Length': String(end - start + 1),
            'Content-Range': `bytes ${start}-${end}/${total}`,
        },
    };

    const gcsReq = httpsRequest(gcsUrl, options as any, (gcsRes) => {
        res.status(gcsRes.statusCode || 500);
        gcsRes.pipe(res);
    });

    req.pipe(gcsReq);
}

// === STEP 3: STATUS PROBE ===
async function getStatus(req: NextApiRequest, res: NextApiResponse) {
    const { uploadId, total } = req.body || {};
    if (!uploadId || !total) return json(res, 400, { error: 'Missing uploadId or total' });

    const { sessionUrl, contentType } = await verifyUploadJWT(uploadId);

    const gcsUrl = new URL(sessionUrl);
    const options = {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'Content-Length': '0',
            'Content-Range': `bytes */${total}`,
        },
    };

    const gcsReq = httpsRequest(gcsUrl, options as any, (gcsRes) => {
        const range = gcsRes.headers['range'] || null;
        const complete = (gcsRes.statusCode === 200 || gcsRes.statusCode === 201);
        json(res, 200, {
            uploaded: range ? parseInt(range.split('-')[1], 10) + 1 : 0,
            complete,
        });
    });

    gcsReq.end();
}

// === STEP 4: COMPLETE UPLOAD ===
async function completeUpload(req: NextApiRequest, res: NextApiResponse) {
    const { uploadId, brandfolderId, sectionId, name, description, labels, customFields } = req.body || {};
    if (!uploadId || !name) return json(res, 400, { error: 'Missing uploadId or name' });

    const { objectUrl, fileName, contentType } = await verifyUploadJWT(uploadId);

    const bfId = brandfolderId || DEFAULT_BRANDFOLDER_ID;
    const secId = sectionId || DEFAULT_SECTION_ID;

    const payload: any = {
        name,
        attachments: [{
            url: objectUrl,
            filename: fileName,
            content_type: contentType,
        }],
    };
    if (secId) payload.section_id = secId;
    if (description) payload.description = description;
    if (labels) payload.labels = labels;
    if (customFields) payload.custom_fields = customFields;

    const resp = await fetch(`https://brandfolder.com/api/v4/brandfolders/${bfId}/assets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${BF_API_KEY}`,
        },
        body: JSON.stringify(payload),
    });

    if (!resp.ok) {
        throw new Error(`Brandfolder asset creation failed: ${await resp.text()}`);
    }
    const data = await resp.json();
    return json(res, 200, data);
}
