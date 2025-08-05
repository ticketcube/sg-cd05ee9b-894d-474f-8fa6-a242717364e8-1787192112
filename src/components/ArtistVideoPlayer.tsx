import { useState, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, VideoOff, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Artist } from "@/types/artists";

interface ArtistForPlayer {
  artist_name: string;
  artist_tiktok_username?: string | null;
  artist_tiktok_videoid?: string | null;
  artist_videolink?: string | null;
  artist_image?: string | null;
}

interface ArtistVideoPlayerProps {
  artist: Artist | ArtistForPlayer;
  size?: "sm" | "md" | "lg";
  className?: string;
  onPlayerError?: () => void;
  videoOverrideId?: string;
  videoLinks?: string[];
  currentIndex?: number;
  onChangeIndex?: (newIndex: number) => void;
  isEmbed?: boolean;
  showNavigationControls?: boolean;
}

const extractYouTubeVideoId = (url: string): string | null => {
  console.log("🎥 Extracting YouTube ID from URL:", url);
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/v\/([^&?#]+)/,
    /youtube\.com\/watch\?.*v=([^&?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log("🎥 Successfully extracted YouTube ID:", match[1]);
      return match[1];
    }
  }
  
  console.log("🎥 Failed to extract YouTube ID from URL:", url);
  return null;
};

const isValidImageUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== "string" || url.trim() === "" || url === "null" || url === "undefined") {
    return false;
  }
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

export default function ArtistVideoPlayer({
  artist,
  size = "lg",
  className,
  onPlayerError,
  videoOverrideId,
  videoLinks = [],
  currentIndex = 0,
  onChangeIndex,
  isEmbed = false,
  showNavigationControls = false,
}: ArtistVideoPlayerProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Parse video links from artist data if not provided
  const processedVideoLinks = useMemo(() => {
    if (videoLinks.length > 0) return videoLinks;
    if (artist.artist_videolink) {
      return artist.artist_videolink.split(",").map(s => s.trim()).filter(s => s);
    }
    return [];
  }, [artist.artist_videolink, videoLinks]);

  const videoContent = useMemo(() => {
    let extractedVideoId: string | null = null;

    console.log("🎥 ArtistVideoPlayer - Processing artist:", {
      name: artist.artist_name,
      videolink: artist.artist_videolink,
      tiktok_videoid: artist.artist_tiktok_videoid,
      tiktok_username: artist.artist_tiktok_username,
      videoOverrideId,
      processedVideoLinks
    });

    // Use override ID first, then current video from links, then fallback to artist data
    const sourceUrl = videoOverrideId || 
      (processedVideoLinks.length > 0 ? processedVideoLinks[currentIndex] : null) ||
      (artist.artist_videolink ? artist.artist_videolink.split(",")[0].trim() : null);
    
    console.log("🎥 Source URL:", sourceUrl);

    if (sourceUrl) {
      extractedVideoId = extractYouTubeVideoId(sourceUrl);
      console.log("🎥 Extracted YouTube ID:", extractedVideoId);
      if (extractedVideoId) {
        return {
          type: "youtube" as const,
          videoId: extractedVideoId,
          embedUrl: `https://www.youtube.com/embed/${extractedVideoId}?autoplay=1&rel=0&modestbranding=1`,
          thumbnailUrl: `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg`,
        };
      }
    }
    
    if (!extractedVideoId && artist.artist_tiktok_videoid) {
      extractedVideoId = artist.artist_tiktok_videoid;
      console.log("🎥 Using TikTok video ID:", extractedVideoId);
      const tiktokThumbnail = isValidImageUrl(artist.artist_image) 
        ? artist.artist_image 
        : null;
      
      return {
        type: "tiktok" as const,
        videoId: extractedVideoId,
        embedUrl: `https://www.tiktok.com/embed/v2/${extractedVideoId}`,
        thumbnailUrl: tiktokThumbnail,
      };
    }

    console.log("🎥 No video content found for artist:", artist.artist_name);
    return { 
      type: "none" as const, 
      videoId: null, 
      embedUrl: null, 
      thumbnailUrl: isValidImageUrl(artist.artist_image) ? artist.artist_image : null 
    };
  }, [artist, videoOverrideId, processedVideoLinks, currentIndex]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🎥 Play button clicked for artist:", artist.artist_name);
    console.log("🎥 Video content:", videoContent);
    console.log("🎥 Video type:", videoContent.type);
    console.log("🎥 Embed URL:", videoContent.embedUrl);
    
    if (videoContent.type !== "none" && videoContent.embedUrl) {
      console.log("🎥 Opening video dialog...");
      setIsVideoOpen(true);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    if (onPlayerError) {
      onPlayerError();
    }
  };

  const handleNext = () => {
    if (onChangeIndex && currentIndex < processedVideoLinks.length - 1) {
      onChangeIndex(currentIndex + 1);
      setVideoError(false);
    }
  };

  const handlePrevious = () => {
    if (onChangeIndex && currentIndex > 0) {
      onChangeIndex(currentIndex - 1);
      setVideoError(false);
    }
  };

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-full h-full",
  };

  const playButtonSizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const hasMultipleVideos = processedVideoLinks.length > 1;
  const fallbackImage = videoContent.thumbnailUrl || artist.artist_image;

  // Video embed component for reuse
  const videoEmbed = (
    <div className="relative w-full pt-[56.25%]">
      {!videoError && videoContent.embedUrl ? (
        <iframe
          src={videoContent.embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleVideoError}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 text-white rounded-lg">
          <div className="text-center">
            <VideoOff className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg">Video failed to load</p>
          </div>
        </div>
      )}
    </div>
  );

  // If embed mode, return just the video
  if (isEmbed) {
    return videoEmbed;
  }

  return (
    <>
      <div 
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={handlePlay}
      >
        <div className="w-full h-full bg-cover bg-center bg-gray-800 relative">
          {isValidImageUrl(fallbackImage) ? (
            <Image 
              src={fallbackImage} 
              alt={`${artist.artist_name} video thumbnail`}
              fill
              style={{ objectFit: "cover" }}
              onError={() => setVideoError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-white text-xs font-bold text-center px-2">
                {artist.artist_name}
              </span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200" />
        
        {videoContent.type !== "none" && !videoError && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
              <Play className={`${playButtonSizes[size]} text-black fill-black`} />
            </div>
          </motion.div>
        )}
      </div>

      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/75"
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold text-white">{artist.artist_name}</h3>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {videoEmbed}
                </motion.div>
              </AnimatePresence>

              {hasMultipleVideos && showNavigationControls && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="text-white border-white hover:bg-white hover:text-black"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-white text-sm">
                    {currentIndex + 1} of {processedVideoLinks.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === processedVideoLinks.length - 1}
                    className="text-white border-white hover:bg-white hover:text-black"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
