
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface TinyInlineVideoPlayerProps {
  artist: {
    artist_name: string;
    artist_tiktok_username?: string | null;
    artist_tiktok_videoid?: string | null;
    artist_videolink?: string | null;
    artist_image?: string | null;
  };
  className?: string;
}

export default function TinyInlineVideoPlayer({ 
  artist, 
  className = "" 
}: TinyInlineVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    // Priority 1: YouTube video
    if (artist.artist_videolink) {
      const videoId = getYouTubeVideoId(artist.artist_videolink);
      if (videoId) {
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&muted=1&rel=0&controls=0&modestbranding=1&showinfo=0`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          thumbnailText: "YouTube Video"
        };
      }
    }
    
    // Priority 2: TikTok video
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

  const handleClick = () => {
    if (videoContent.type === "image") return;
    
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setVideoError(false);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    setIsPlaying(false);
  };

  return (
    <div 
      className={`relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer group flex-shrink-0 ${className}`}
      onClick={handleClick}
    >
      {isPlaying && !videoError && videoContent.type !== "image" ? (
        // Inline Video Player
        <div className="w-full h-full relative">
          <iframe
            ref={iframeRef}
            src={videoContent.embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onError={handleVideoError}
          />
          {/* Pause overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Pause className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      ) : (
        // Thumbnail View
        <>
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
                <span className="text-white text-xs font-bold text-center px-1">
                  {artist.artist_name.slice(0, 3)}
                </span>
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200" />
          
          {/* Play Button */}
          {videoContent.type !== "image" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 rounded-full p-1 group-hover:bg-opacity-100 group-hover:scale-110 transition-all duration-200">
                <Play className="w-3 h-3 text-black fill-black" />
              </div>
            </div>
          )}

          {/* Error State */}
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80">
              <span className="text-white text-xs">!</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
