
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  KanbanSquare,
  ExternalLink
} from "lucide-react";
import { uploadToSupabaseStorage } from "@/services/staffUploadService";

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
      const result = await uploadToSupabaseStorage(
        selectedFile.file,
        {
          description: description.trim(),
          uploadedBy: profile.username || "Unknown",
          uploadedByEmail: user.email || "unknown@email.com",
          originalFileName: selectedFile.file.name,
          fileSize: selectedFile.file.size,
          mimeType: selectedFile.file.type,
        },
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      console.log("Upload successful:", result);
      setUploadStatus("success");
      setUploadProgress(100);
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
                    onClick={() => router.push("/profile")}
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
            {/* Media Upload - Tabbed Interface */}
            <Card className="bg-white border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Media Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="brandfolder" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="brandfolder" className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Brandfolder
                    </TabsTrigger>
                    <TabsTrigger value="aimc" className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      AIMC
                    </TabsTrigger>
                  </TabsList>

                  {/* Brandfolder Upload Tab */}
                  <TabsContent value="brandfolder" className="mt-0">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ExternalLink className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 mb-1">External Upload via Brandfolder</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {profile?.username || user?.email}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-4">
                          Brandfolder's guest upload page will open in a new tab. Files uploaded there will be available in the shared folder.
                        </p>

                        <Button
                          onClick={() => window.open("https://brandfolder.com/guest_upload/4wm45s566vvsmfcscp6g6mh", "_blank")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                        >
                          <ExternalLink className="w-5 h-5 mr-2" />
                          Open Brandfolder Upload Page
                        </Button>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-xs text-slate-600 mb-2 font-medium">Why not embedded?</p>
                        <p className="text-xs text-slate-500">
                          Brandfolder's security settings prevent embedding their upload page in iframes. 
                          For large file uploads with their advanced features, use the external page. 
                          For quick internal uploads, use the AIMC tab.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* AIMC Upload Tab (Supabase Storage) */}
                  <TabsContent value="aimc" className="mt-0">
                    {uploadStatus === "success" ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                          Upload Successful!
                        </h3>
                        <p className="text-slate-600 mb-6">
                          Your file has been securely uploaded to Supabase Storage.
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
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Database className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-600 mb-1">Uploading as</p>
                              <p className="text-lg font-semibold text-slate-900">
                                {profile?.username || user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <p className="text-xs text-purple-600 font-medium">
                              ✓ Supabase Storage • Up to 50GB per file • Automatic chunking
                            </p>
                          </div>
                        </div>

                        {/* File Selection or Preview */}
                        {!selectedFile ? (
                          <div
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                            <h4 className="font-semibold text-slate-700 mb-1">Browse Files</h4>
                            <p className="text-slate-500 text-sm mb-2">
                              Select images, videos, or any file up to 50GB
                            </p>
                            <p className="text-xs text-purple-600">
                              Large files handled automatically by Supabase
                            </p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,video/*,application/*"
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
                                <div className="p-2 bg-purple-100 rounded-lg">
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
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6"
                        >
                          {uploadStatus === "uploading" ? (
                            <>
                              <Upload className="w-5 h-5 mr-2 animate-pulse" />
                              Uploading to Supabase...
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              Upload to Supabase Storage
                            </>
                          )}
                        </Button>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            ✓ Why Supabase Storage?
                          </p>
                          <p className="text-xs text-green-600">
                            Handles large files automatically (up to 50GB), secure storage with RLS policies, 
                            integrated with your staff authentication, and no complex API calls required.
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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

            {/* NEW: Project Tracker Card */}
            <Card 
              className="bg-gradient-to-br from-purple-600 to-pink-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group lg:col-span-2"
              onClick={() => router.push("/admin/project-tracker")}
            >
              <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <KanbanSquare className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Project Tracker
                      </h3>
                      <p className="text-purple-100 leading-relaxed max-w-xl">
                        Manage internal projects, track tasks, and collaborate with the team using our simple Kanban boards.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <Button 
                    className="bg-white hover:bg-purple-50 text-purple-700 font-semibold shadow-lg group-hover:shadow-xl transition-all px-8 py-6 h-auto text-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/admin/project-tracker");
                    }}
                  >
                    Open Tracker
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
