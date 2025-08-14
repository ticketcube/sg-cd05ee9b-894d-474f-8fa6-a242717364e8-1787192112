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
import { startResumableUpload } from "@/lib/upload"; // consolidated upload.ts

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

    // Role-based access control
    useEffect(() => {
        if (user && user.role !== 'otwstaff') router.push('/');
    }, [user, router]);

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
        setSelectedFile({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("image/") ? "image" :
                file.type.startsWith("video/") ? "video" : "other"
        });
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;

        setUploadStatus("uploading");
        setUploadProgress(0);
        setErrorMessage("");

        try {
            await startResumableUpload({
                file: selectedFile.file,
                userName: user.username,
                description: description.trim(),
                onProgress: (percent) => setUploadProgress(percent)
            });

            setUploadProgress(100);
            setUploadStatus("success");
        } catch (err: any) {
            console.error("Upload failed:", err);
            setErrorMessage(err?.message || "Upload failed");
            setUploadStatus("error");
            setUploadProgress(0);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setDescription("");
        setErrorMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getFileIcon = (type: string) => {
        if (type === "image") return <ImageIcon className="w-6 h-6" />;
        if (type === "video") return <Video className="w-6 h-6" />;
        return <File className="w-6 h-6" />;
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ["Bytes", "KB", "MB", "GB"];
        if (bytes === 0) return "0 Bytes";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-black text-white">
                <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
                    <div className="max-w-md mx-auto flex items-center gap-3 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/")}
                            className="text-white hover:bg-gray-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <h1 className="text-xl font-bold text-blue-500 truncate">SHOW US YOUR FAVS</h1>
                    </div>
                </div>

                <div className="p-4 max-w-md mx-auto">
                    {uploadStatus === "success" ? (
                        <Card className="bg-gray-900 border-gray-700">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">Upload Successful!</h2>
                                <p className="text-gray-400 mb-6">Your file has been uploaded successfully.</p>
                                <div className="space-y-3">
                                    <Button onClick={resetUpload} className="w-full bg-green-600 hover:bg-green-700">
                                        Upload Another File
                                    </Button>
                                    <Button onClick={() => router.push("/")} variant="ghost" className="w-full text-white hover:bg-gray-800">
                                        Return Home
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
