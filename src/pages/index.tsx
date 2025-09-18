import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Gift, Compass, Star, Trophy, Users, Calendar, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/contexts/UserProfileContext";
import WeeklyListCard from '@/components/dashboard/WeeklyListCard';

export default function HomePage() {
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("discover");
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { isAuthenticated, sessionLoading, loading: profileLoading } = useUserProfile();

    // Navigation cleanup ref
    const navigatingRef = useRef(false);

    // Redirect effect based on the fast session check
    useEffect(() => {
        // Wait until the initial session check is complete
        if (sessionLoading || profileLoading) {
            return;
        }

        // If the check is done and the user is logged in, redirect immediately.
        if (isAuthenticated && !navigatingRef.current) {
            navigatingRef.current = true;
            console.log('[HomePage] Authenticated user detected, redirecting to dashboard');
            router.replace("/discovery-dashboard");
        }
    }, [sessionLoading, isAuthenticated, profileLoading, router]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            navigatingRef.current = false;
        };
    }, []);

    const handleRegisterClick = () => {
        if (isAuthenticated) {
            navigatingRef.current = true;
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

    const handleAuthClose = () => {
        setAuthDialogOpen(false);
    };

    // Show a full-page loader while checking the auth session or navigating
    // This prevents the "flash" of the homepage for logged-in users before they redirect.
    if (sessionLoading || (isAuthenticated && profileLoading) || navigatingRef.current) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-lg">
                        {navigatingRef.current ? 'Redirecting...' : 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="text-center mb-4">
                <h1 className="text-xl font-extrabold tracking-tight lg:text-5xl">
                    We Reward Discovery
                </h1>
               

            </div>
            {/* Hero Video */}
            <div className="relative overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-auto max-h-[80vh] object-cover"
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

            {/* Register CTA */}
            <div className="flex justify-center py-8 bg-white">
                <Button
                    onClick={handleRegisterClick}
                    className="bg-purple-deep hover:bg-red-700 text-white text-lg px-8 py-4 rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                    {isAuthenticated ? 'Go to Dashboard' : 'Register to Discover Rewards'}
                </Button>
            </div>
            <div className="px-2 pb-4">
                <div className="max-w-6xl mx-auto">
                    <WeeklyListCard />
                </div>
            </div>            

          
            {/* Signup Dialog */}
            <AuthDialog isOpen={isAuthDialogOpen} onClose={handleAuthClose} title="Join OnesToWatch" />
        </div>
    );
}






