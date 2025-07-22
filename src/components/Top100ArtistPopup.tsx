
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Artist } from "@/services/artistService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Top100ArtistPopupProps {
  artist: Artist | null;
  isOpen: boolean;
  onClose: () => void;
  onVote: (artist: Artist) => void;
  selectedArtists: string[];
}

export function Top100ArtistPopup({ 
  artist, 
  isOpen, 
  onClose, 
  onVote, 
  selectedArtists 
}: Top100ArtistPopupProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [imgSrc, setImgSrc] = useState("/otwcolor-md6dlfkk.png");

  useEffect(() => {
    if (artist?.artist_image && 
        artist.artist_image.trim() !== '' && 
        artist.artist_image.toLowerCase() !== 'null') {
      setImgSrc(artist.artist_image);
    } else {
      setImgSrc("/otwcolor-md6dlfkk.png");
    }
  }, [artist]);

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

  // Determine what video content to display based on available data
  const getVideoContent = () => {
    if (!artist) return null;

    // Priority 1: TikTok video
    if (artist.artist_tiktok_username && 
        artist.artist_tiktok_videoid &&
        artist.artist_tiktok_username.toLowerCase() !== 'null' &&
        artist.artist_tiktok_videoid.toLowerCase() !== 'null') {
      return {
        type: "tiktok",
        embedUrl: getTikTokEmbedUrl(artist.artist_tiktok_username, artist.artist_tiktok_videoid),
        thumbnailText: "TikTok Video"
      };
    }
    
    // Priority 2: YouTube video
    if (artist.artist_videolink && 
        artist.artist_videolink.trim() !== '' &&
        artist.artist_videolink.toLowerCase() !== 'null') {
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
    
    return null;
  };

  const handleShowVideo = () => {
    const videoContent = getVideoContent();
    if (videoContent) {
      setShowVideo(true);
      setVideoError(false);
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
      videoTimeoutRef.current = setTimeout(() => {
        setShowVideo(false);
      }, 30000); // 30 seconds timeout
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  useEffect(() => {
    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, []);

  if (!artist) return null;

  const videoContent = getVideoContent();
  const hasVideo = !!videoContent;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{artist.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-lg">OnesToWatch Class of: {new Date(artist.artist_otwcreateddate || "").getFullYear()}</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-center justify-between">
                <button
                  onClick={() => onVote(artist)}
                  className={cn(
                    "text-white px-6 py-3 rounded font-semibold text-lg transition-colors",
                    selectedArtists.includes(artist.UUID) 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {selectedArtists.includes(artist.UUID) ? "VOTED" : "TOP 25 VOTE"}
                </button>

                {/* Video Module */}
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "relative w-24 h-24 rounded-lg overflow-hidden group",
                      hasVideo ? "cursor-pointer" : ""
                    )}
                    onClick={hasVideo ? handleShowVideo : undefined}
                  >
                    {/* Background Image */}
                    <div 
                      className="w-full h-full bg-cover bg-center bg-gray-800"
                      style={{
                        backgroundImage: videoContent?.thumbnailUrl 
                          ? `url(${videoContent.thumbnailUrl})` 
                          : `url(${imgSrc})`
                      }}
                    >
                      {/* Fallback content when no thumbnail */}
                      {!videoContent?.thumbnailUrl && !imgSrc.includes('otwcolor') && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                          <span className="text-white text-xs font-bold text-center px-2">
                            {artist.artist_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overlay */}
                    {hasVideo && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200" />
                    )}
                    
                    {/* Play Button */}
                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
                          <Play className="w-6 h-6 text-black fill-black" />
                        </div>
                      </div>
                    )}

                    {/* Video Type Badge */}
                    {hasVideo && (
                      <div className="absolute top-1 right-1">
                        <span className={`text-xs px-2 py-1 rounded text-white font-semibold ${
                          videoContent?.type === "tiktok" 
                            ? "bg-pink-500" 
                            : "bg-red-500"
                        }`}>
                          {videoContent?.type === "tiktok" ? "TT" : "YT"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500 mt-2 text-center">
                    {hasVideo ? "Click To Watch" : "No Video Available"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black">
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setShowVideo(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Video Content */}
            <div className="aspect-video w-full">
              {!videoError && videoContent ? (
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
                      {artist.artist_name} - {videoContent?.thumbnailText || "Video"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 bg-gray-900 text-white">
              <h3 className="font-semibold text-lg">{artist.artist_name}</h3>
              <p className="text-sm text-gray-400">{videoContent?.thumbnailText || "Video"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
