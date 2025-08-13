
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

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
  
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("File size must be less than 100MB");
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
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 500);

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
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
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

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" passHref>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-neutral-300" />
            <h1 className="text-2xl font-bold text-neutral-900">
              Upload to Brandfolder
            </h1>
          </div>

          {uploadStatus === "success" ? (
            /* Success State */
            <Card className="max-w-md mx-auto bg-white border-0 shadow-xl shadow-green-500/10">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  Upload Successful!
                </h2>
                <p className="text-neutral-600 mb-6">
                  Your file has been uploaded to Brandfolder successfully.
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
                    className="w-full"
                  >
                    Return Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Upload Form */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* File Selection */}
              <Card className="bg-white border-0 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Select Media File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed border-neutral-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">
                        Choose files to upload
                      </h3>
                      <p className="text-neutral-600 text-sm mb-4">
                        Select images or videos up to 100MB
                      </p>
                      <Button 
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Files
                      </Button>
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
                      <div className="relative bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                        <button
                          onClick={resetUpload}
                          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-neutral-100 transition-colors"
                        >
                          <X className="w-4 h-4 text-neutral-600" />
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
                          <div className="w-full h-40 bg-neutral-200 rounded-lg flex items-center justify-center">
                            <File className="w-12 h-12 text-neutral-400" />
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center gap-3">
                          {getFileIcon(selectedFile.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 truncate">
                              {selectedFile.file.name}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {formatFileSize(selectedFile.file.size)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description for this file..."
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Details & Progress */}
              <Card className="bg-white border-0 shadow-lg shadow-neutral-900/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="w-5 h-5 text-emerald-600" />
                    Upload Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Info */}
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <Label className="text-sm font-medium text-neutral-700">Uploading as</Label>
                    <p className="text-lg font-semibold text-neutral-900">{user?.username}</p>
                  </div>

                  {/* Upload Progress */}
                  {uploadStatus === "uploading" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-neutral-700">Upload Progress</span>
                        <span className="text-sm text-neutral-600">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-neutral-600 text-center">
                        Uploading to Brandfolder...
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadStatus === "uploading"}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                    size="lg"
                  >
                    {uploadStatus === "uploading" ? (
                      "Uploading..."
                    ) : selectedFile ? (
                      "Upload to Brandfolder"
                    ) : (
                      "Select a file first"
                    )}
                  </Button>

                  {/* Info */}
                  <div className="text-xs text-neutral-500 space-y-1">
                    <p>• Supported formats: Images and Videos</p>
                    <p>• Maximum file size: 100MB</p>
                    <p>• Files will be uploaded to your Brandfolder account</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
