
import ReactPlayer from 'react-player';
import { VideoOff } from 'lucide-react';

interface ArtistVideoPlayerProps {
  artist_videolink: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPlayerError?: () => void;
}

export default function ArtistVideoPlayer({
  artist_videolink,
  onPlay,
  onPause,
  onEnded,
  onPlayerError
}: ArtistVideoPlayerProps) {
  if (!artist_videolink) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <VideoOff className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg">No Video Available</p>
        </div>
      </div>
    );
  }

  return (
    <ReactPlayer
      url={artist_videolink}
      width="100%"
      height="100%"
      playing={true}
      controls={true}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onError={onPlayerError}
    />
  );
}
