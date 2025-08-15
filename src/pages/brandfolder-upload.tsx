
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  File, 
  Image as ImageIcon, 
  Video,
  X
} from "lucide-react";
import { useRouter } from "next/router";
import AuthGuard from "@/components/AuthGuard";

// pages/brandfolder-upload.tsx

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function BrandfolderUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startUpload = async () => {
    if (!file) return;
    setUploading(true);
    setPaused(false);
    setUploadedBytes(0);
    setDone(false);

    const resp = await fetch('/api/brandfolder/upload?action=initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type })
    });

    if (!resp.ok) {
      alert('Failed to initiate upload');
      setUploading(false);
      return;
    }
    const data = await resp.json();
    setUploadId(data.uploadId);
    uploadChunks(data.uploadId, 0);
  };

  const uploadChunks = async (id: string, startByte: number) => {
    if (!file) return;
    abortRef.current = new AbortController();
    let offset = startByte;

    try {
      while (offset < file.size) {
        if (paused) break;

        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const chunkStart = offset;
        const chunkEnd = offset + chunk.size - 1;

        const resp = await fetch(`/api/brandfolder/upload?action=chunk&uploadId=${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'X-Upload-Offset-Start': String(chunkStart),
            'X-Upload-Offset-End': String(chunkEnd),
            'X-Upload-Total': String(file.size)
          },
          body: chunk,
          signal: abortRef.current.signal
        });

        if (resp.status === 308) {
          const range = resp.headers.get('Range') || resp.headers.get('range');
          const end = range ? parseInt(range.split('-')[1], 10) : chunkEnd;
          offset = end + 1;
          setUploadedBytes(offset);
        } else if (resp.ok) {
          offset = chunkEnd + 1;
          setUploadedBytes(offset);
        } else {
          throw new Error(`Chunk upload failed: ${resp.status}`);
        }
      }

      if (offset >= file.size) {
        await completeUpload(id);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const pauseUpload = () => {
    setPaused(true);
    abortRef.current?.abort();
  };

  const resumeUpload = async () => {
    if (!file || !uploadId) return;
    setPaused(false);
    const resp = await fetch('/api/brandfolder/upload?action=status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, total: file.size })
    });
    if (!resp.ok) {
      alert('Failed to get status');
      return;
    }
    const data = await resp.json();
    setUploadedBytes(data.uploaded);
    uploadChunks(uploadId, data.uploaded);
  };

  const completeUpload = async (id: string) => {
    const resp = await fetch('/api/brandfolder/upload?action=complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: id })
    });
    if (resp.ok) {
      setDone(true);
      setFile(null);
      setUploadId(null);
      setUploadedBytes(0);
    } else {
      alert('Failed to complete upload');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Upload to Brandfolder</h1>

      {!done ? (
        <>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={uploading}
            className="mb-4"
          />

          {file && (
            <div className="mb-4">
              <p>{file.name}</p>
              <progress value={uploadedBytes} max={file.size} className="w-full" />
              <p>{Math.round((uploadedBytes / file.size) * 100)}%</p>
            </div>
          )}

          {!uploading && file && <button onClick={startUpload}>Start Upload</button>}
          {uploading && !paused && <button onClick={pauseUpload}>Pause</button>}
          {paused && <button onClick={resumeUpload}>Resume</button>}
        </>
      ) : (
        <p className="text-green-500 font-bold">Thank you! Your file has been uploaded.</p>
      )}
    </div>
  );
}


}