import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import WeeklyListCard from "@/components/dashboard/WeeklyListCard";

export default function HomePage() {
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef < HTMLVideoElement > (null);

    const { isAuthenticated, sessionLoading, loading: profileLoading } = useUserProfile();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Handle redirect after auth check
    useEffect(() => {
        if (!sessionLoading && !profileLoading && isAuthenticated) {
            setIsRedirecting(true);
            router.replace("/discovery-dashboard");
        }
    }, [isAuthenticated, sessionLoading, profileLoading, router]);

    // Show a loader if session still checking or redirecting
    const isLoading = sessionLoading || profileLoading || isRedirecting;

    const handleRegisterClick = () => {
        if (isAuthenticated) {
            setIsRedirecting(true);
            router.push("/discovery-dashboard");
        } else {
            setAuthDialogOpen(true);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-lg">
                        {isRedirecting ? "Redirecting..." : "Loading..."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>OnesToWatch</title>
                <meta
                    name="description"
                    content="Your personal OTW Chart profile, survey, and favorite artists."
                />
                <meta
                    name="impact-site-verification"
                    content="fe37854f-ba34-4601-b522-0ed2f2e0336b"
                />
            </Head>

            <div className="min-h-screen bg-white flex flex-col items-center justify-start">
                {/* Hero Section */}
                <div className="w-full flex flex-col items-center text-center px-4 lg:px-0 pt-0 lg:pt-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 lg:mb-6">
                        We Reward Discovery
                    </h1>

                    {/* Hero Video */}
                    <div className="relative w-full max-w-4xl lg:max-w-5xl aspect-video overflow-hidden rounded-xl shadow-lg mb-6">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            src="https://cdn.brandfolder.io/364H2QNG/as/n56ftqn44kcpxgt6xgbfwqt9/AR_RRP.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                        <button
                            onClick={toggleMute}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg transition-all"
                        >
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                    </div>

                    <p className="text-base sm:text-lg lg:text-xl text-gray-800 max-w-3xl mb-8 lg:mb-12">
                        Earn points for discovering new artists. We'll reward you with prizes,
                        exclusive merch, and insider access!
                    </p>

                    {/* CTA Button */}
                    <div className="w-full flex justify-center">
                        <Button
                            onClick={handleRegisterClick}
                            className="bg-purple-deep hover:bg-red-700 text-white text-lg sm:text-xl lg:text-2xl px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Register to Discover Rewards"}
                        </Button>
                    </div>
                </div>

                {/* Weekly list section */}
                <div className="w-full px-4 lg:px-0 py-8 max-w-6xl mx-auto">
                    <WeeklyListCard onArtistClick={handleRegisterClick} />
                </div>

                {/* Signup Dialog */}
                <AuthDialog
                    isOpen={isAuthDialogOpen}
                    onClose={() => setAuthDialogOpen(false)}
                    title="Join OnesToWatch"
                />
            </div>
        </>
    );
}
