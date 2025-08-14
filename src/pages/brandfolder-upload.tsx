
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

export default function BrandfolderUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Role-based access control - redirect non-staff users
  useEffect(() => {
    if (user && user.role !== 'otwstaff') {
      console.warn('Access denied: User does not have otwstaff role');
      router.push('/');
    }
  }, [user, router]);

  // Don't render the page content if user is not otwstaff
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
        // Check if response is JSON before trying to parse
        const contentType = response.headers.get("content-type");
        let errorMessage = "Upload failed";
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const error = await response.json();
            errorMessage = error.error || error.message || "Upload failed";
          } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        } else {
          // Response is not JSON, likely an HTML error page
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText.substring(0, 200));
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
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
                    Your file has been uploaded successfully.
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
                        Select images or videos up to 100MB
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
                      <p className="text-sm text-gray-400 text-center">
                        Uploading your favorite...
                      </p>
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
                      "Upload"
                    ) : (
                      "Select a file first"
                    )}
                  </Button>

                  {/* Disclaimers */}
                  <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-800">
                    <p>• Supported formats: Images and Videos</p>
                    <p>• Maximum file size: 100MB</p>
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