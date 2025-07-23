import { useState } from "react";
import { Play, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ArtistVideoPlayerProps {
  artist: {
    artist_name: string;
    artist_tiktok_username?: string | null;
    artist_tiktok_videoid?: string | null;
    artist_videolink?: string | null;
    artist_image?: string | null;
  };
  className?: string;
  showPlayButton?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ArtistVideoPlayer({ 
  artist, 
  className = "", 
  showPlayButton = true,
  size = "md" 
}: ArtistVideoPlayerProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Helper function to create TikTok embed URL
  const getTikTokEmbedUrl = (username: string, videoId: string): string => {
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  };

  // Determine what to display based on available content
  const getVideoContent = () => {
    // Priority 1: YouTube video (changed from TikTok to YouTube)
    if (artist.artist_videolink) {
      const videoId = getYouTubeVideoId(artist.artist_videolink);
      if (videoId) {
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          thumbnailText: "YouTube Video"
        };
      }
    }
    
    // Priority 2: TikTok video (moved to second priority, preserved for later use)
    if (artist.artist_tiktok_username && artist.artist_tiktok_videoid) {
      return {
        type: "tiktok",
        embedUrl: getTikTokEmbedUrl(artist.artist_tiktok_username, artist.artist_tiktok_videoid),
        thumbnailText: "TikTok Video"
      };
    }
    
    // Priority 3: Artist image/logo
    return {
      type: "image",
      thumbnailUrl: artist.artist_image || "/logo.png",
      thumbnailText: "Artist Image"
    };
  };

  const videoContent = getVideoContent();
  
  // Size configurations
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const playButtonSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  const handleVideoClick = () => {
    if (videoContent.type !== "image") {
      setIsVideoOpen(true);
      setVideoError(false);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <>
      {/* Video Thumbnail/Preview */}
      <div 
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={handleVideoClick}
      >
        {/* Background Image */}
        <div 
          className="w-full h-full bg-cover bg-center bg-gray-800"
          style={{
            backgroundImage: videoContent.thumbnailUrl 
              ? `url(${videoContent.thumbnailUrl})` 
              : undefined
          }}
        >
          {/* Fallback content when no thumbnail */}
          {!videoContent.thumbnailUrl && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-white text-xs font-bold text-center px-2">
                {artist.artist_name}
              </span>
            </div>
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200" />
        
        {/* Play Button */}
        {showPlayButton && videoContent.type !== "image" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
              <Play className={`${playButtonSizes[size]} text-black fill-black`} />
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Video Content */}
            <div className="aspect-video w-full">
              {!videoError ? (
                <iframe
                  src={videoContent.embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={handleVideoError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                  <div className="text-center">
                    <p className="text-lg mb-2">Video could not be loaded</p>
                    <p className="text-sm text-gray-400">
                      {artist.artist_name} - {videoContent.thumbnailText}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 bg-gray-900 text-white">
              <h3 className="font-semibold text-lg">{artist.artist_name}</h3>
              <p className="text-sm text-gray-400">{videoContent.thumbnailText}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
