
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  Music, 
  Upload, 
  Play, 
  Star, 
  Sparkles, 
  Users, 
  Heart,
  Camera,
  Video,
  FileVideo,
  CloudUpload
} from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { useState, useEffect, useCallback } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Handle any routing errors by staying on index
  useEffect(() => {
    const handleRouteChangeError = () => {
      router.push("/");
    };

    router.events.on('routeChangeError', handleRouteChangeError);
    return () => {
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  const handleNavigation = async (path: string) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    
    try {
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleAuthClose = () => {
    setAuthDialogOpen(false);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedVideo(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedVideo(file);
        const url = URL.createObjectURL(file);
        setVideoPreview(url);
      }
    }
  };

  const removeVideo = () => {
    setUploadedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-purple-950/20 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-12 pb-8">
          {/* Welcome message for logged in users */}
          {user && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-green-200 font-medium">
                  Welcome back, {user.username || 'Music Curator'}!
                </p>
              </div>
            </div>
          )}

          {/* Main Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-full px-6 py-2 border border-purple-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
              <span className="text-purple-200 text-sm font-medium tracking-wide">DISCOVER • VOTE • EARN</span>
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              OnesToWatch
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-300 mb-8 leading-relaxed max-w-2xl mx-auto font-light">
              The community-driven platform where music discovery meets rewards
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-400 mb-12">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>12K+ Curators</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-green-400" />
                <span>50K+ Artists</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Weekly Rewards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="container mx-auto px-6 mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Share Your Discovery</h2>
              </div>
              <p className="text-neutral-300 text-lg">
                Upload a video of an artist you think deserves recognition
              </p>
            </div>

            <Card className="bg-gradient-to-br from-neutral-800/40 to-neutral-900/60 backdrop-blur-sm border border-neutral-700/50 shadow-2xl shadow-purple-500/5">
              <CardContent className="p-8">
                {!uploadedVideo ? (
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? "border-blue-400 bg-blue-500/10 scale-105" 
                        : "border-neutral-600 hover:border-neutral-500 hover:bg-neutral-800/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        dragActive 
                          ? "bg-blue-500/20 scale-110" 
                          : "bg-gradient-to-br from-purple-500/20 to-blue-500/20"
                      }`}>
                        <CloudUpload className={`w-10 h-10 transition-all duration-300 ${
                          dragActive ? "text-blue-400 animate-bounce" : "text-purple-400"
                        }`} />
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {dragActive ? "Drop your video here!" : "Upload Your Video"}
                        </h3>
                        <p className="text-neutral-400 mb-4">
                          Drag and drop or click to select a video file
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-500">
                          <Badge variant="secondary" className="bg-neutral-700/50">MP4</Badge>
                          <Badge variant="secondary" className="bg-neutral-700/50">MOV</Badge>
                          <Badge variant="secondary" className="bg-neutral-700/50">AVI</Badge>
                          <Badge variant="secondary" className="bg-neutral-700/50">Max 100MB</Badge>
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                      >
                        <FileVideo className="w-5 h-5 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      {videoPreview && (
                        <video
                          src={videoPreview}
                          controls
                          className="max-w-full h-64 rounded-xl shadow-lg"
                        />
                      )}
                      <Button
                        onClick={removeVideo}
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-neutral-300 mb-4">
                      <strong>{uploadedVideo.name}</strong> ready to upload!
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => !user ? setAuthDialogOpen(true) : console.log('Upload video')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        {user ? 'Submit Discovery' : 'Sign Up to Submit'}
                      </Button>
                      <Button 
                        onClick={removeVideo}
                        variant="outline"
                        className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                      >
                        Choose Different Video
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="container mx-auto px-6 mb-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Discovery Rewards Card */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/10 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent 
                className="relative p-8 h-full flex flex-col justify-between"
                onClick={() => handleNavigation("/discovery-dashboard")}
              >
                <div>
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Trophy className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-center mb-4 text-white">
                    Earn Rewards
                  </h2>
                  <p className="text-center text-neutral-300 mb-6 leading-relaxed">
                    Vote on weekly artist discoveries and earn points for exclusive rewards, early access, and special perks
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-neutral-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>Points System</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span>Exclusive Access</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-105">
                  {user ? "Continue Earning!" : "Start Your Journey!"}
                </Button>
              </CardContent>
            </Card>

            {/* Music Discovery Card */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent 
                className="relative p-8 h-full flex flex-col justify-between"
                onClick={() => handleNavigation("/top100")}
              >
                <div>
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-center mb-4 text-white">
                    Explore Charts
                  </h2>
                  <p className="text-center text-neutral-300 mb-6 leading-relaxed">
                    Discover trending artists, explore comprehensive rankings, and dive into genre-specific charts
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-neutral-400 mb-6">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-blue-400" />
                      <span>All Genres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-400" />
                      <span>Live Updates</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-105">
                  Explore Music Charts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="container mx-auto px-6 pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <Music className="w-6 h-6 text-blue-400" />
              <span className="text-neutral-400 font-medium">Powered by community votes and engagement</span>
              <Music className="w-6 h-6 text-blue-400" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Join thousands of music curators discovering the next big artists before they hit the mainstream
            </p>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onClose={handleAuthClose}
        title="Join OnesToWatch Community"
      />
    </div>
  );
}
