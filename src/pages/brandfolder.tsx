import { useState, useRef } from "react";
import AuthGuard from "@/components/AuthGuard";
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
    X,
} from "lucide-react";
import { useRouter } from "next/router";
import { useUserProfile } from "@/contexts/UserProfileContext";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FilePreview {
    file: File;
    preview: string;
    type: "image" | "video" | "other";
}

function BrandfolderUploadPage() {
    const router = useRouter();
    const { user, profile } = useUserProfile();
    const fileInputRef = useRef < HTMLInputElement > (null);

    const [selectedFile, setSelectedFile] = useState < FilePreview | null > (null);
    const [uploadStatus, setUploadStatus] = useState < UploadStatus > ("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024 * 1024) {
            setErrorMessage("File size must be less than 15GB");
            return;
        }

        const preview = URL.createObjectURL(file);
        const type = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
                ? "video"
                : "other";

        setErrorMessage("");
        setSelectedFile({ file, preview, type });
    };

    const handleUpload = async () => {
        if (!selectedFile || !user || !profile) return;

        setUploadStatus("uploading");
        setUploadProgress(0);
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile.file);
            formData.append("fileName", selectedFile.file.name);
            formData.append("fileType", selectedFile.file.type);
            formData.append(
                "userName",
                profile?.username || user?.email || "Anonymous"
            );
            if (description.trim()) {
                formData.append("description", description.trim());
            }

            // Simulated progress for smoother UX
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 90));
            }, 400);

            const response = await fetch("/api/brandfolder/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.ok) {
                const result = await response.json();
                console.log("Upload successful:", result);
                setUploadStatus("success");
            } else {
                const contentType = response.headers.get("content-type");
                let errorMsg = "Upload failed";

                if (contentType?.includes("application/json")) {
                    const errData = await response.json();
                    errorMsg = errData.error || errData.message || errorMsg;
                } else {
                    const text = await response.text();
                    errorMsg = `Server error (${response.status}): ${text.slice(0, 200)}`;
                }
                throw new Error(errorMsg);
            }
        } catch (err) {
            console.error("Upload error:", err);
            setUploadStatus("error");
            setErrorMessage(
                err instanceof Error ? err.message : "Upload failed unexpectedly"
            );
            setUploadProgress(0);
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setDescription("");
        setErrorMessage("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getFileIcon = (type: string) => {
        if (type === "image") return <ImageIcon className="w-6 h-6" />;
        if (type === "video") return <Video className="w-6 h-6" />;
        return <File className="w-6 h-6" />;
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow z-10 p-4 border-b border-gray-200">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/")}
                        className="text-gray-700 hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-xl font-bold text-blue-600 truncate">
                        Upload to Brandfolder
                    </h1>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 max-w-md mx-auto">
                {uploadStatus === "success" ? (
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Upload Successful!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Your file has been uploaded successfully.
                            </p>
                            <div className="space-y-3">
                                <Button
                                    onClick={resetUpload}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Upload Another File
                                </Button>
                                <Button
                                    onClick={() => router.push("/")}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Return Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-white shadow-lg">
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Uploading as</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {profile?.username || user?.email}
                                </p>
                            </div>

                            {!selectedFile ? (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-700">Browse Files</h3>
                                    <p className="text-gray-500 text-sm">Select files up to 15GB</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <button
                                            onClick={resetUpload}
                                            className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                        >
                                            <X className="w-4 h-4 text-gray-600" />
                                        </button>
                                        {selectedFile.type === "image" && (
                                            <img
                                                src={selectedFile.preview}
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                        )}
                                        {selectedFile.type === "video" && (
                                            <video
                                                src={selectedFile.preview}
                                                controls
                                                className="w-full h-40 rounded-lg"
                                            />
                                        )}
                                        <div className="mt-3 flex items-center gap-3">
                                            {getFileIcon(selectedFile.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate">
                                                    {selectedFile.file.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional description..."
                                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 resize-none"
                                        rows={3}
                                    />
                                </div>
                            )}

                            {uploadStatus === "uploading" && (
                                <div className="space-y-2">
                                    <Progress value={uploadProgress} className="h-2" />
                                    <p className="text-sm text-gray-500 text-center">
                                        Uploading... {Math.round(uploadProgress)}%
                                    </p>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {errorMessage}
                                </div>
                            )}

                            <Button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploadStatus === "uploading"}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function GuardedBrandfolderUploadPage() {
    return (
        <AuthGuard>
            <BrandfolderUploadPage />
        </AuthGuard>
    );
}
v