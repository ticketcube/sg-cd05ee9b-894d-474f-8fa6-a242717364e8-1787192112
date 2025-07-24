import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Play, VideoOff } from "lucide-react";
import Image from "next/image";
import type { VibeArtist } from "@/types/artists";

interface VibeArtistPopupProps {
  artist: VibeArtist;
  isOpen: boolean;
  onClose: () => void;
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

export default function VibeArtistPopup({ artist, isOpen, onClose }: VibeArtistPopupProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const getVideoContent = () => {
    const sourceUrl = artist.artist_videolink ? artist.artist_videolink.split(",")[0].trim() : null;

    if (sourceUrl) {
      const extractedVideoId = extractYouTubeVideoId(sourceUrl);
      if (extractedVideoId) {
        return {
          type: "youtube",
          videoId: extractedVideoId,
          embedUrl: `https://www.youtube.com/embed/${extractedVideoId}?autoplay=1&mute=0`,
          thumbnailUrl: `https://img.youtube.com/vi/${extractedVideoId}/maxresdefault.jpg`,
        };
      }
    }

    return { 
      type: "none", 
      videoId: null, 
      embedUrl: null, 
      thumbnailUrl: isValidImageUrl(artist.artist_image) ? artist.artist_image : null 
    };
  };

  const videoContent = getVideoContent();

  const handlePlayVideo = () => {
    if (videoContent.type !== "none") {
      setIsVideoPlaying(true);
    }
  };

  const handleCloseVideo = () => {
    setIsVideoPlaying(false);
    setVideoError(false);
  };

  const handleClose = () => {
    setIsVideoPlaying(false);
    setVideoError(false);
    onClose();
  };

  return (
    <>
      {/* Artist Info Dialog */}
      <Dialog open={isOpen && !isVideoPlaying} onOpenChange={handleClose}>
        <DialogContent className="max-w-md w-full bg-gray-900 border-gray-700 text-white">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 text-white hover:bg-gray-800"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="space-y-4 pt-6">
              {/* Artist Image/Video Thumbnail */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
                {isValidImageUrl(videoContent.thumbnailUrl) ? (
                  <Image
                    src={videoContent.thumbnailUrl}
                    alt={`${artist.artist_name} thumbnail`}
                    fill
                    style={{ objectFit: 'cover' }}
                    onError={() => setVideoError(true)}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                    <span className="text-white text-lg font-bold text-center px-4">
                      {artist.artist_name}
                    </span>
                  </div>
                )}

                {/* Play Button Overlay */}
                {videoContent.type !== "none" && !videoError && (
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer hover:bg-opacity-60 transition-all duration-200"
                    onClick={handlePlayVideo}
                  >
                    <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 hover:scale-110 transition-all duration-200">
                      <Play className="w-8 h-8 text-black fill-black" />
                    </div>
                  </div>
                )}

                {/* No Video Available */}
                {(videoContent.type === "none" || videoError) && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <VideoOff className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No video available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">{artist.artist_name}</h2>
                
                {artist.artist_genre && (
                  <p className="text-gray-300">
                    <span className="text-gray-400">Genre:</span> {artist.artist_genre}
                  </p>
                )}

                {/* Vibe Badges */}
                <div className="flex flex-wrap gap-2">
                  {artist.primary_vibe && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Primary: {artist.primary_vibe}
                    </Badge>
                  )}
                  {artist.secondary_vibe && (
                    <Badge variant="secondary" className="bg-gray-600 hover:bg-gray-700">
                      Secondary: {artist.secondary_vibe}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={isVideoPlaying} onOpenChange={handleCloseVideo}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative aspect-video">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/75"
              onClick={handleCloseVideo}
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
                onError={() => setVideoError(true)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
