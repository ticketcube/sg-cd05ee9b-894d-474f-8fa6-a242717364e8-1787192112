import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Loader2 } from 'lucide-react';

interface ArtistVideoPlayerProps {
    videoUrl: string;
    onWatchComplete: () => void;
}

const ArtistVideoPlayer: React.FC<ArtistVideoPlayerProps> = ({ videoUrl, onWatchComplete }) => {
    const [isLoading, setIsLoading] = useState(true);
    const hasCompletedRef = useRef(false);

    // Reset the completion status whenever a new video URL is passed in.
    // This is crucial for when the user closes one artist modal and opens another.
    useEffect(() => {
        hasCompletedRef.current = false;
        setIsLoading(true);
    }, [videoUrl]);

    const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
        if (!hasCompletedRef.current && playedSeconds >= 15) {
            console.log("15 seconds watch time reached. Calling onWatchComplete.");
            hasCompletedRef.current = true; // Prevents the function from being called multiple times
            onWatchComplete();
        }
    };

    // A collection of event handlers to manage the loading state for better UX.
    const handleReady = () => setIsLoading(false);
    const handleBuffer = () => setIsLoading(true);
    const handlePlay = () => setIsLoading(false);

    const isPlayable = videoUrl && ReactPlayer.canPlay(videoUrl);

    return (
        <div className="w-full h-full bg-black flex items-center justify-center relative">
            {isPlayable ? (
                <>
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-10">
                            <Loader2 className="h-12 w-12 text-white animate-spin" />
                            <p className="text-white mt-2">Loading Video...</p>
                        </div>
                    )}
                    <ReactPlayer
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true} // Attempts to autoplay, browsers may block this
                        onProgress={handleProgress}
                        onReady={handleReady}
                        onBuffer={handleBuffer}
                        onPlay={handlePlay}
                    />
                </>
            ) : (
                <div className="text-center p-4">
                    <p className="text-white">Video could not be loaded.</p>
                    <p className="text-xs text-gray-400 mt-2">The provided URL may be invalid or unsupported.</p>
                </div>
            )}
        </div>
    );
};

export default ArtistVideoPlayer;