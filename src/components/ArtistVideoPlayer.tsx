
import { useState, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, VideoOff } from "lucide-react";
import { Artist } from "@/services/artistService";

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
  isEmbed?: boolean;
}

const extractYouTubeVideoId = (url: string): string | null => {
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

const isValidImageUrl = (url: string | null | undefined): url is string => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null' || url === 'undefined') {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

export default function ArtistVideoPlayer({
  artist,
  size = "lg",
  className,
  onPlayerError,
  videoOverrideId,
  isEmbed = false,
}: ArtistVideoPlayerProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoContent = useMemo(() => {
    let extractedVideoId: string | null = null;

    const sourceUrl = videoOverrideId || (artist.artist_videolink ? artist.artist_videolink.split(",")[0].trim() : null);

    if (sourceUrl) {
      extractedVideoId = extractYouTubeVideoId(sourceUrl);
      if (extractedVideoId) {
        return {
          type: "youtube",
          videoId: extractedVideoId,
          embedUrl: `https://www.youtube.com/embed/${extractedVideoId}?autoplay=1&mute=1`,
          thumbnailUrl: `https://img.youtube.com/vi/${extractedVideoId}/mqdefault.jpg`,
        };
      }
    }
    
    if (!extractedVideoId && artist.artist_tiktok_videoid) {
      extractedVideoId = artist.artist_tiktok_videoid;
      const tiktokThumbnail = isValidImageUrl(artist.artist_image) 
        ? artist.artist_image 
        : null;
      
      return {
        type: "tiktok",
        videoId: extractedVideoId,
        embedUrl: `https://www.tiktok.com/embed/v2/${extractedVideoId}`,
        thumbnailUrl: tiktokThumbnail,
      };
    }

    return { 
      type: "none", 
      videoId: null, 
      embedUrl: null, 
      thumbnailUrl: isValidImageUrl(artist.artist_image) ? artist.artist_image : null 
    };
  }, [artist, videoOverrideId]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoContent.type !== "none") {
      setIsVideoOpen(true);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    if (onPlayerError) {
      onPlayerError();
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

  if (isEmbed) {
    if (videoContent.type === "none" || videoError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <VideoOff className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg">Video could not be loaded</p>
          </div>
        </div>
      );
    }
    return (
      <iframe
        src={videoContent.embedUrl || ""}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={handleVideoError}
      />
    );
  }

  return (
    <>
      <div 
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden cursor-pointer group ${className}`}
        onClick={handlePlay}
      >
        <div className="w-full h-full bg-cover bg-center bg-gray-800 relative">
          {isValidImageUrl(videoContent.thumbnailUrl) ? (
            <Image 
              src={videoContent.thumbnailUrl} 
              alt={`${artist.artist_name} video thumbnail`}
              fill
              style={{ objectFit: 'cover' }}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
              <Play className={`${playButtonSizes[size]} text-black fill-black`} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative aspect-video">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/75"
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {videoContent.embedUrl && (
              <iframe
                src={videoContent.embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
