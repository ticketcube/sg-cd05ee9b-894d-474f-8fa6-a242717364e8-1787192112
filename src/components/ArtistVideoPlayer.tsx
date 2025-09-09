import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer to prevent SSR issues
const ReactPlayerDynamic = dynamic(() => import('react-player'), { ssr: false });

// Cast to any to bypass stubborn type issue from the library
const ReactPlayer = ReactPlayerDynamic as any;

export interface ArtistVideoPlayerProps {
  artist_videolink: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  className?: string;
  size?: string;
}

export function ArtistVideoPlayer({
  artist_videolink,
  onPlay,
  onPause,
  onEnded,
  onError,
  className = "",
  size = "w-full h-48"
}: ArtistVideoPlayerProps) {
  if (!artist_videolink) {
    return (
      <div className={`${size} bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No video available</p>
      </div>
    );
  }

  return (
    <div className={`${size} ${className}`}>
      <ReactPlayer 
        url={artist_videolink}
        width="100%"
        height="100%"
        playing
        controls
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />
    </div>
  );
}

export default ArtistVideoPlayer;