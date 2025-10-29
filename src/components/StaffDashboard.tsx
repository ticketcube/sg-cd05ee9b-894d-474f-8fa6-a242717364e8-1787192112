
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Database, 
  Music2, 
  MapPin, 
  Video,
  ArrowRight,
  Upload,
  CheckCircle,
  AlertCircle,
  File,
  Image as ImageIcon,
  X
} from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FilePreview {
  file: File;
  preview: string;
  type: "image" | "video" | "other";
}

export function StaffDashboard() {
  const { profile, user } = useUserProfile();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase() 
    : user.email?.charAt(0).toUpperCase() || "S";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Staff Profile Header - Cleaner version without top gradient */}
          <Card className="bg-white border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar className="h-20 w-20 border-4 border-blue-100 shadow-md bg-gradient-to-br from-blue-100 to-indigo-100">
                  <AvatarFallback className="text-blue-700 font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {profile.username || "Staff Member"}
                    </h2>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Admin Role</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                     variant="default"
                        size="sm"
                        onClick={() => router.push("/staffdashboard")}
                        className="bg-purple-900 hover:bg-purple-800 text-white font-medium whitespace-nowrap shadow-md"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Brandfolder Upload - Consolidated Section */}
            <Card className="bg-white border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Brandfolder Media Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {uploadStatus === "success" ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Upload Successful!
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Your file has been uploaded to Brandfolder.
                    </p>
                    <Button
                      onClick={resetUpload}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Upload Another File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-slate-600 mb-1">Uploading as</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {profile?.username || user?.email}
                      </p>
                    </div>

                    {/* File Selection or Preview */}
                    {!selectedFile ? (
                      <div
                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h4 className="font-semibold text-slate-700 mb-1">Browse Files</h4>
                        <p className="text-slate-500 text-sm">
                          Select images or videos up to 15GB
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
                        <div className="relative bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <button
                            onClick={resetUpload}
                            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 shadow-sm border border-slate-200"
                          >
                            <X className="w-4 h-4 text-slate-600" />
                          </button>
                          {selectedFile.type === "image" && (
                            <img
                              src={selectedFile.preview}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                          )}
                          {selectedFile.type === "video" && (
                            <video
                              src={selectedFile.preview}
                              controls
                              className="w-full h-48 rounded-lg mb-3"
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getFileIcon(selectedFile.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {selectedFile.file.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-2 block">
                            Description (Optional)
                          </label>
                          <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description for this file..."
                            className="bg-white border-slate-300 text-slate-800 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Progress */}
                    {uploadStatus === "uploading" && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-slate-600 text-center">
                          Uploading... {Math.round(uploadProgress)}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Upload Button */}
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadStatus === "uploading"}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                    >
                      {uploadStatus === "uploading" ? (
                        <>
                          <Upload className="w-5 h-5 mr-2 animate-pulse" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Upload to Brandfolder
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Artist Database Card */}
            <Card 
              className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              onClick={() => router.push("/artist-lookup")}
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  OTW Artist Database
                </h3>
                
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Lookup, Edit and Add OTW Artists to our 850+ Artist Database
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <Music2 className="w-4 h-4" />
                    <span>Required: Artist Name & Genre</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Required: Home Location</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <Video className="w-4 h-4" />
                    <span>Required: Video URL</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-white hover:bg-blue-50 text-blue-700 font-semibold shadow-lg group-hover:shadow-xl transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/artist-lookup");
                  }}
                >
                  Access Database
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
