
import { useState, useEffect, useRef } from "react";
import { Artist } from "@/services/artistService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TikTokEmbed } from "@/components/TikTokEmbed";

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
  const videoTimeoutRef = useRef<NodeJS.Timeout>();

  const handleShowVideo = () => {
    setShowVideo(true);
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
    }
    videoTimeoutRef.current = setTimeout(() => {
      setShowVideo(false);
    }, 15000);
  };

  useEffect(() => {
    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, []);

  if (!artist) return null;

  const artistImageSrc = artist.artist_image || "/otwcolor-md6dlfkk.png";
  const hasVideo = artist.artist_tiktok_username && artist.artist_tiktok_videoid;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{artist.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>OnesToWatch Class of: {new Date(artist.artist_otwcreateddate || "").getFullYear()}</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => onVote(artist)}
                  className={cn(
                    "text-white px-6 py-2 rounded font-semibold",
                    selectedArtists.includes(artist.UUID) 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {selectedArtists.includes(artist.UUID) ? "VOTED" : "TOP 25 VOTE"}
                </button>

                {hasVideo && (
                  <div className="flex flex-col items-center">
                    <img
                      src={artistImageSrc}
                      alt={artist.artist_name}
                      className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleShowVideo}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/otwcolor-md6dlfkk.png";
                      }}
                    />
                    <span className="text-xs text-gray-500 mt-1 text-center">Click To Watch</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{artist.artist_name} - Video</DialogTitle>
          </DialogHeader>
          {hasVideo && (
            <div className="w-full flex justify-center">
              <TikTokEmbed 
                username={artist.artist_tiktok_username!}
                videoId={artist.artist_tiktok_videoid!}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
