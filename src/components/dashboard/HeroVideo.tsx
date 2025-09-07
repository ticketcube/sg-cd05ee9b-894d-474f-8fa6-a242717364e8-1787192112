import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VolumeX, Volume2 } from 'lucide-react';

export default function HeroVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <div className="mt-8">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
                <video
                    ref={videoRef}
                    className="w-full h-auto max-h-[60vh] object-cover"
                    src="https://cdn.brandfolder.io/364H2QNG/as/n56ftqn44kcpxgt6xgbfwqt9/AR_RRP.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
                <button
                    onClick={toggleMute}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>
            <div className="flex justify-center mt-6">
                <Link href="/weekly-ratings">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-5 py-2.5 rounded-xl shadow-lg text-white">
                        Rate This Week&apos;s Artists
                    </Button>
                </Link>
            </div>
        </div>
    );
}
