
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
import { useToast } from "@/hooks/use-toast";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FilePreview {
    file: File;
    preview: string;
    type: "image" | "video" | "other";
}

export default function BrandfolderUploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size (15GB limit)
        if (file.size > 15 * 1024 * 1024 * 1024) {
            setErrorMessage("File size must be less than 15GB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            setErrorMessage("Please select an image or video file");
            return;
        }

        setErrorMessage("");

        // Create preview
        const preview = URL.createObjectURL(file);
        const type = file.type.startsWith("image/") ? "image" :
            file.type.startsWith("video/") ? "video" : "other";

        setSelectedFile({ file, preview, type });
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to upload files.",
                variant: "destructive",
            });
            return;
        }

        const file = selectedFile.file;
        const userName = user.username || "Unknown Uploader";
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks

        setUploadStatus("uploading");
        setIsLoading(true);
        setUploadProgress((uploadedBytes / file.size) * 100);
        setStatusMessage("Upload failed. You can retry.");

        try {
            // Step 1: Start resumable upload session
            setStatusMessage("Starting resumable session...");

            const startRes = await fetch("/api/brandfolder/upload?action=start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    userName: userName,
                    description: description || "",
                    fileSize: file.size
                })
            });

            if (!startRes.ok) {
                const errorData = await startRes.json();
                throw new Error(errorData.error || "Failed to start upload session");
            }

            const { resumableUploadUrl, objectUrl } = await startRes.json();

            // Step 2: Check if any bytes have been uploaded previously (resumability)
            setStatusMessage("Checking upload status...");

            let uploadedBytes = 0;
            try {
                const statusRes = await fetch("/api/brandfolder/upload?action=status", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        resumableUploadUrl,
                        fileSize: file.size
                    })
                });

                // FIXED: Accept both 200 and 308 status codes (Google Cloud returns 308 for Resume Incomplete)
                if (statusRes.status === 200 || statusRes.status === 308) {
                    const statusData = await statusRes.json();
                    uploadedBytes = statusData.uploadedBytes || 0;
                }
            } catch (statusError) {
                console.log("Status check failed, starting from beginning:", statusError);
                uploadedBytes = 0;
            }

            // Step 3: Upload file in chunks
            const totalChunks = Math.ceil(file.size / chunkSize);
            const startChunk = Math.floor(uploadedBytes / chunkSize);

            // FIXED: Better UX message for small files
            if (totalChunks === 1) {
                setStatusMessage("Uploading file...");
            } else {
                setStatusMessage(`Uploading ${totalChunks} chunks...`);
            }

            for (let chunkIndex = startChunk; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);
                const isLastChunk = end === file.size;

                if (totalChunks === 1) {
                    setStatusMessage("Uploading file...");
                } else {
                    setStatusMessage(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);
                }

                // Retry logic for each chunk
                let retries = 3;
                let chunkUploaded = false;

                while (retries > 0 && !chunkUploaded) {
                    try {
                        const chunkResponse = await fetch(resumableUploadUrl, {
                            method: "PUT",
                            headers: {
                                "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
                                // FIXED: Consistent Content-Type - use same file.type from initialization
                                "Content-Type": file.type || "application/octet-stream"
                            },
                            body: chunk
                        });

                        // Accept both 200 (final chunk) and 308 (resume incomplete) as success
                        if (chunkResponse.ok || chunkResponse.status === 308) {
                            chunkUploaded = true;
                            uploadedBytes = end;

                            // Update progress
                            const progressPercent = (uploadedBytes / file.size) * 100;
                            setUploadProgress(progressPercent);

                            console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully (${start}-${end - 1}/${file.size})`);

                            if (isLastChunk && chunkResponse.ok) {
                                console.log("🎉 All chunks uploaded successfully!");
                            }
                        } else {
                            throw new Error(`Chunk upload failed with status ${chunkResponse.status}: ${chunkResponse.statusText}`);
                        }
                    } catch (chunkError) {
                        retries--;
                        console.error(`❌ Chunk ${chunkIndex + 1} upload attempt failed:`, chunkError);

                        if (retries === 0) {
                            throw new Error(`Failed to upload chunk ${chunkIndex + 1} after 3 attempts: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`);
                        }

                        // FIXED: Proper exponential backoff calculation (1s, 2s, 4s)
                        const attempt = 3 - retries; // 0, 1, 2
                        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
                        setStatusMessage(`Retrying chunk ${chunkIndex + 1} in ${delay/1000}s... (${3 - retries}/3)`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // Step 4: Finalize asset creation in Brandfolder
            setStatusMessage("Creating asset in Brandfolder...");

            const finalDescription = description.trim() || `Upload from ${userName}`;


            const finalizeRes = await fetch("/api/brandfolder/upload?action=create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    userName: userName,
                    description: description || "",
                    objectUrl: objectUrl
                })
            });

            if (!finalizeRes.ok) {
                const errorData = await finalizeRes.json();
                throw new Error(errorData.error || "Failed to create asset in Brandfolder");
            }

            const result = await finalizeRes.json();

            setStatusMessage("Upload complete!");
            setUploadProgress(100);
            setUploadStatus("success");

            console.log("🎉 Chunked upload completed successfully:", result);

        } catch (error) {
            console.error("💥 Chunked upload error:", error);
            const errorMsg = error instanceof Error ? error.message : "Upload failed";
            
            setUploadStatus("error");
            setErrorMessage(errorMsg);
            // FIXED: Better error context - don't clear statusMessage completely
            setStatusMessage("Upload failed. See error above.");
            setUploadProgress(0);
        } finally {
            setIsLoading(false);
        }
    };

    const resetUpload = () => {
        // FIXED: Revoke object URL to prevent memory leaks
        if (selectedFile?.preview) {
            URL.revokeObjectURL(selectedFile.preview);
        }
        
        setSelectedFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setDescription("");
        setErrorMessage("");
        setStatusMessage("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
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
                {/* Header */}
                <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center gap-3 mb-4">
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
                </div>

                <div className="p-4">
                    <div className="max-w-md mx-auto">
                        {uploadStatus === "success" ? (
                            /* Success State */
                            <Card className="bg-gray-900 border-gray-700">
                                <CardContent className="p-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-2">
                                        Upload Successful!
                                    </h2>
                                    <p className="text-gray-400 mb-6">
                                        Your file has been uploaded successfully using chunked resumable upload.
                                    </p>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={resetUpload}
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            Upload Another File
                                        </Button>
                                        <Button
                                            onClick={() => router.push("/")}
                                            variant="ghost"
                                            className="w-full text-white hover:bg-gray-800"
                                        >
                                            Return Home
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Upload Form */
                            <Card className="bg-gray-900 border-gray-700">
                                <CardContent className="p-6 space-y-6">
                                    {/* User Info */}
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">Uploading as</p>
                                        <p className="text-lg font-semibold text-white">{user?.username}</p>
                                    </div>

                                    {/* File Selection/Preview */}
                                    {!selectedFile ? (
                                        <div
                                            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-colors">
                                                <Upload className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <h3 className="font-semibold text-white mb-2">
                                                Browse Files
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                Select images or videos up to 100MB (now with chunked upload support!)
                                            </p>
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
                                            {/* File Preview */}
                                            <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700">
                                                <button
                                                    onClick={resetUpload}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-gray-300" />
                                                </button>

                                                {selectedFile.type === "image" ? (
                                                    <img
                                                        src={selectedFile.preview}
                                                        alt="Preview"
                                                        className="w-full h-40 object-cover rounded-lg"
                                                    />
                                                ) : selectedFile.type === "video" ? (
                                                    <video
                                                        src={selectedFile.preview}
                                                        controls
                                                        className="w-full h-40 rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-full h-40 bg-gray-700 rounded-lg flex items-center justify-center">
                                                        <File className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}

                                                <div className="mt-3 flex items-center gap-3">
                                                    {getFileIcon(selectedFile.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-white truncate">
                                                            {selectedFile.file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            {formatFileSize(selectedFile.file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description Field */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-300">Description (Optional)</p>
                                                <Textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Tell us about this favorite..."
                                                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Progress */}
                                    {uploadStatus === "uploading" && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-300">Upload Progress</span>
                                                <span className="text-sm text-gray-400">{Math.round(uploadProgress)}%</span>
                                            </div>
                                            <Progress value={uploadProgress} className="h-2 bg-gray-800" />
                                            {statusMessage && (
                                                <p className="text-sm text-blue-400 text-center">
                                                    {statusMessage}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {errorMessage && (
                                        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            <p className="text-sm text-red-400">{errorMessage}</p>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <Button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploadStatus === "uploading"}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-lg py-3"
                                        size="lg"
                                    >
                                        {uploadStatus === "uploading" ? (
                                            "Uploading..."
                                        ) : selectedFile ? (
                                            "Upload with Chunked Resume"
                                        ) : (
                                            "Select a file first"
                                        )}
                                    </Button>

                                    {/* Disclaimers */}
                                    <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-800">
                                        <p>• Supported formats: Images and Videos</p>
                                        <p>• Maximum file size: 100MB</p>
                                        <p>• Uses chunked resumable upload for reliability</p>
                                        <p>• Upload automatically resumes if interrupted</p>
                                        <p>• Files will be uploaded to our content library</p>
                                        <p>• By uploading, you confirm you own the rights to this content</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}