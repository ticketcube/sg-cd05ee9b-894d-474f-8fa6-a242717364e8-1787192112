import { useState, useRef } from "react";
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
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef < HTMLInputElement > (null);

    const [selectedFile, setSelectedFile] = useState < FilePreview | null > (null);
    const [uploadStatus, setUploadStatus] = useState < UploadStatus > ("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    if (user && user.role !== 'otwstaff') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                    <p className="text-gray-400">Redirecting you to the homepage...</p>
                </div>
            </div>
        );
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) {
            setErrorMessage("File size must be less than 100MB");
            return;
        }

        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            setErrorMessage("Please select an image or video file");
            return;
        }

        setErrorMessage("");
        const preview = URL.createObjectURL(file);
        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other";
        setSelectedFile({ file, preview, type });
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;

        setUploadStatus("uploading");
        setUploadProgress(0);
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile.file);
            formData.append("fileName", selectedFile.file.name);
            formData.append("fileType", selectedFile.file.type);
            formData.append("userName", user.username);
            if (description.trim()) formData.append("description", description.trim());

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/brandfolder/upload");

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    setUploadProgress((event.loaded / event.total) * 100);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setUploadStatus("success");
                } else {
                    setUploadStatus("error");
                    setErrorMessage(`Upload failed: ${xhr.statusText}`);
                }
            };

            xhr.onerror = () => {
                setUploadStatus("error");
                setErrorMessage("Upload failed due to network error.");
            };

            xhr.send(formData);

        } catch (err) {
            setUploadStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Upload failed");
            setUploadProgress(0);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setDescription("");
        setErrorMessage("");
