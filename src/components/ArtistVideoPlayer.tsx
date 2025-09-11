
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Loader2 } from 'lucide-react';

interface ArtistVideoPlayerProps {
    videoUrl: string;
    onWatchComplete: () => void;
}

const ArtistVideoPlayer: React.FC<ArtistVideoPlayerProps> = ({ videoUrl, onWatchComplete }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasMounted, setHasMounted] = useState(false); // State to track client-side mount
    const hasCompletedRef = useRef(false);

    // This effect runs only once on the client, after the component mounts.
    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Reset completion status when video changes
    useEffect(() => {
        console.log(`Artist Video Player: The videoUrl prop is ${videoUrl ? 'present' : 'absent'}. URL: "${videoUrl || 'Not provided'}"`);
        hasCompletedRef.current = false;
        // We set it to true here to show the spinner when a new video is loaded in.
        setIsLoading(true);
    }, [videoUrl]);

    const handleProgress = ({ playedSeconds }: { playedSeconds: number }) => {
        if (!hasCompletedRef.current && playedSeconds >= 15) {
            console.log("15 seconds watch time reached. Calling onWatchComplete.");
            hasCompletedRef.current = true;
            onWatchComplete();
        }
    };

    const handleReady = () => setIsLoading(false);
    const handleBuffer = () => setIsLoading(true);
    const handlePlay = () => setIsLoading(false);
    const handleError = (e: any) => {
        console.error('ReactPlayer Error:', e);
        setIsLoading(false);
    };

    // We can only check if the URL is playable on the client-side
    const isPlayable = hasMounted && videoUrl && ReactPlayer.canPlay(videoUrl);

    return (
        <div className="w-full h-full bg-black flex items-center justify-center relative">
            {hasMounted ? (
                isPlayable ? (
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
                            onProgress={handleProgress}
                            onReady={handleReady}
                            onBuffer={handleBuffer}
                            onPlay={handlePlay}
                            onError={handleError}
                        />
                    </>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-white">Video could not be loaded.</p>
                        <p className="text-xs text-gray-400 mt-2">The provided URL may be invalid or unsupported.</p>
                    </div>
                )
            ) : (
                // Initial state before client-side hydration, showing a generic loader
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-10">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                    <p className="text-white mt-2">Initializing Player...</p>
                </div>
            )}
        </div>
    );
};

export default ArtistVideoPlayer;
