
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

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FilePreview {
  file: File;
  preview: string;
  type: "image" | "video" | "other";
}

export default function MobileUploader() {
    const [file, setFile] = useState < File | null > (null);
    const [progress, setProgress] = useState < number > (0);
    const [uploading, setUploading] = useState < boolean > (false);
    const [paused, setPaused] = useState < boolean > (false);
    const [message, setMessage] = useState < string > ("");

    const uploadUrlRef = useRef < string | null > (null);
    const offsetRef = useRef < number > (0);
    const abortController = useRef < AbortController | null > (null);

    const chunkSize = 5 * 1024 * 1024; // 5MB

    // Restore session if available
    useEffect(() => {
        const savedUrl = localStorage.getItem("resumableUploadUrl");
        const savedOffset = localStorage.getItem("resumableOffset");
        if (savedUrl && savedOffset) {
            uploadUrlRef.current = savedUrl;
            offsetRef.current = parseInt(savedOffset, 10);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setProgress(0);
            setMessage("");
        }
    };

    const startNewUpload = async () => {
        if (!file) return;
        setUploading(true);
        setPaused(false);

        try {
            const startRes = await fetch("/api/upload?action=start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileType: file.type })
            });

            const { resumableUploadUrl, objectUrl } = await startRes.json();
            uploadUrlRef.current = resumableUploadUrl;
            offsetRef.current = 0;

            localStorage.setItem("resumableUploadUrl", resumableUploadUrl);
            localStorage.setItem("objectUrl", objectUrl);
            localStorage.setItem("resumableOffset", "0");

            await uploadChunks();
        } catch (err) {
            console.error(err);
            setMessage("❌ Could not start upload.");
            setUploading(false);
        }
    };

    const resumeUpload = async () => {
        if (!file || !uploadUrlRef.current) return;

        // Ask server how many bytes already uploaded
        const res = await fetch(uploadUrlRef.current, { method: "PUT", headers: { "Content-Range": `bytes */${file.size}` } });
        const rangeHeader = res.headers.get("Range");
        if (rangeHeader) {
            const uploaded = parseInt(rangeHeader.split("-")[1], 10) + 1;
            offsetRef.current = uploaded;
            localStorage.setItem("resumableOffset", uploaded.toString());
        }

        setUploading(true);
        setPaused(false);
        await uploadChunks();
    };

    const uploadChunks = async () => {
        if (!file || !uploadUrlRef.current) return;

        abortController.current = new AbortController();

        while (offsetRef.current < file.size) {
            if (paused) {
                setUploading(false);
                return;
            }

            const chunk = file.slice(offsetRef.current, offsetRef.current + chunkSize);
            const chunkEnd = offsetRef.current + chunk.size - 1;

            try {
                const res = await fetch(uploadUrlRef.current, {
                    method: "PUT",
                    headers: {
                        "Content-Range": `bytes ${offsetRef.current}-${chunkEnd}/${file.size}`
                    },
                    body: chunk,
                    signal: abortController.current.signal
                });

                if (!res.ok) throw new Error(`Chunk upload failed at ${offsetRef.current}`);

                offsetRef.current += chunk.size;
                localStorage.setItem("resumableOffset", offsetRef.current.toString());

                setProgress(Math.round((offsetRef.current / file.size) * 100));
            } catch (err) {
                console.error("Chunk upload error", err);
                setMessage("⚠️ Network issue — try resuming.");
                setUploading(false);
                return;
            }
        }

        // All chunks done — create asset
        const objectUrl = localStorage.getItem("objectUrl");
        if (objectUrl) {
            const createRes = await fetch("/api/upload?action=create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objectUrl, fileName: file.name })
            });

            const data = await createRes.json();
            if (data.success) {
                setMessage("✅ Upload complete!");
                localStorage.removeItem("resumableUploadUrl");
                localStorage.removeItem("resumableOffset");
                localStorage.removeItem("objectUrl");
            } else {
                setMessage("⚠️ Upload finished but asset creation failed.");
            }
        }
        setUploading(false);
    };

    const pauseUpload = () => {
        setPaused(true);
        abortController.current?.abort();
    };


  return (
    <AuthGuard>
          return (
          <div className="p-4 bg-gray-900 text-white rounded-lg w-full max-w-md mx-auto">
              <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="mb-4"
              />

              {file && (
                  <div className="mb-4">
                      <p className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>

                      {!uploading && !uploadUrlRef.current && (
                          <button onClick={startNewUpload} className="bg-blue-500 px-4 py-2 rounded">
                              Start Upload
                          </button>
                      )}

                      {!uploading && uploadUrlRef.current && offsetRef.current < file.size && (
                          <button onClick={resumeUpload} className="bg-green-500 px-4 py-2 rounded">
                              Resume Upload
                          </button>
                      )}

                      {uploading && (
                          <button onClick={pauseUpload} className="bg-yellow-500 px-4 py-2 rounded">
                              Pause Upload
                          </button>
                      )}
                  </div>
              )}

              {uploading && (
                  <div className="mt-4">
                      <div className="w-full bg-gray-700 rounded-full h-4">
                          <div
                              className="bg-green-500 h-4 rounded-full"
                              style={{ width: `${progress}%` }}
                          />
                      </div>
                      <p className="text-sm mt-1">{progress}%</p>
                  </div>
              )}

              {message && <p className="mt-4">{message}</p>}
          </div>
          );
}
    </AuthGuard>
  );
}