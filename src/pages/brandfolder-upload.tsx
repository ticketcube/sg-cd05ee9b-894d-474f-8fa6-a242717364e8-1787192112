// src/pages/brandfolder.tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function BrandfolderUploadPage() {
    const { user } = useAuth();
    const [file, setFile] = useState < File | null > (null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [uploadId, setUploadId] = useState < string | null > (null);
    const [uploadedBytes, setUploadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [paused, setPaused] = useState(false);
    const [assetLink, setAssetLink] = useState < string | null > (null);
    const abortRef = useRef < AbortController | null > (null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            if (f.size > 15 * 1024 * 1024 * 1024) {
                alert('File too large. Max 15GB.');
                return;
            }
            setFile(f);
            setName(f.name);
            setUploadedBytes(0);
            setTotalBytes(f.size);
            setAssetLink(null);
        }
    };

    const initiateUpload = async () => {
        if (!file) return;
        const resp = await fetch('/api/brandfolder/upload?action=initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type,
            }),
        });
        if (!resp.ok) {
            alert('Failed to initiate upload');
            return null;
        }
        const data = await resp.json();
        return data.uploadId as string;
    };

    const uploadChunks = async (id: string, startByte = 0) => {
        if (!file) return;
        setUploading(true);
        setPaused(false);
        abortRef.current = new AbortController();

        let offset = startByte;
        while (offset < file.size) {
            if (paused) {
                setUploading(false);
                return;
            }

            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const chunkStart = offset;
            const chunkEnd = offset + chunk.size - 1;

            const resp = await fetch(`/api/brandfolder/upload?action=chunk&uploadId=${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: {
                    'X-Upload-Offset-Start': String(chunkStart),
                    'X-Upload-Offset-End': String(chunkEnd),
                    'X-Upload-Total': String(file.size),
                },
                body: chunk,
                signal: abortRef.current.signal,
            });

            if (resp.status === 308) {
                // partial, get Range header from server response body
                const rangeData = await resp.json();
                setUploadedBytes(rangeData.range ? parseInt(rangeData.range.split('-')[1], 10) + 1 : offset + chunk.size);
                offset = uploadedBytes;
            } else if (resp.ok) {
                offset = chunkEnd + 1;
                setUploadedBytes(offset);
            } else {
                alert('Upload failed. Try resuming.');
                setUploading(false);
                return;
            }
        }

        // All chunks uploaded
        setUploading(false);
        completeUpload(id);
    };

    const getStatus = async (id: string) => {
        const resp = await fetch('/api/brandfolder/upload?action=status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId: id, total: file?.size }),
        });
        if (!resp.ok) return 0;
        const data = await resp.json();
        return data.uploaded || 0;
    };

    const completeUpload = async (id: string) => {
        const resp = await fetch('/api/brandfolder/upload?action=complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId: id,
                name,
                description,
            }),
        });
        if (!resp.ok) {
            alert('Failed to create Brandfolder asset');
            return;
        }
        const asset = await resp.json();
        setAssetLink(asset?.public_url || null);
    };

    const startUpload = async () => {
        if (!file) return;
        let id = uploadId;
        if (!id) {
            id = await initiateUpload();
            if (!id) return;
            setUploadId(id);
        }

        // Check if resuming
        const alreadyUploaded = await getStatus(id);
        setUploadedBytes(alreadyUploaded);
        await uploadChunks(id, alreadyUploaded);
    };

    const pauseUpload = () => {
        setPaused(true);
        abortRef.current?.abort();
    };

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Brandfolder Upload</CardTitle>
                </CardHeader>
                <CardContent>
                    {!user && <p className="text-red-500">Please log in to upload.</p>}
                    {user && (
                        <>
                            <Input type="file" onChange={handleFileSelect} className="mb-4" />
                            <Input
                                type="text"
                                placeholder="Asset Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mb-2"
                            />
                            <Input
                                type="text"
                                placeholder="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mb-4"
                            />

                            {file && (
                                <>
                                    <Progress value={(uploadedBytes / totalBytes) * 100} className="mb-4" />
                                    <div className="flex space-x-2">
                                        {!uploading && (
                                            <Button onClick={startUpload}>{uploadedBytes > 0 ? 'Resume Upload' : 'Start Upload'}</Button>
                                        )}
                                        {uploading && <Button onClick={pauseUpload}>Pause</Button>}
                                    </div>
                                </>
                            )}

                            {assetLink && (
                                <p className="mt-4">
                                    Upload complete:{" "}
                                    <a href={assetLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                        View Asset
                                    </a>
                                </p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
