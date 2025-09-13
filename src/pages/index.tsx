import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Gift, Compass, Star, Trophy, Users, Calendar, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function HomePage() {
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("discover");
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const { isAuthenticated, sessionLoading } = useUserProfile();

    // Redirect effect based on the fast session check
    useEffect(() => {
        // Wait until the initial session check is complete
        if (sessionLoading) {
            return;
        }

        // If the check is done and the user is logged in, redirect immediately.
        if (isAuthenticated) {
            router.replace("/discovery-dashboard");
        }
    }, [sessionLoading, isAuthenticated, router]);

    const handleRegisterClick = () => {
        if (isAuthenticated) {
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

    // Show a full-page loader while checking the auth session.
    // This prevents the "flash" of the homepage for logged-in users before they redirect.
    if (sessionLoading || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
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
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg transition-all"
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
            </div>

            {/* Register CTA */}
            <div className="flex justify-center py-8 bg-white">
                <Button
                    onClick={handleRegisterClick}
                    className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-4 rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                    {isAuthenticated ? 'Go to Dashboard' : 'Register to Discover Rewards'}
                </Button>
            </div>

            {/* Modern Clean Tabs Section */}
            <div className="bg-white">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    {/* Tab Navigation - Made narrower and tighter */}
                    <div className="flex justify-center mb-8">
                        <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button
                                onClick={() => setActiveTab("discover")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === "discover"
                                        ? "bg-white text-black shadow-sm border border-gray-200"
                                        : "text-gray-600 hover:text-black hover:bg-white/50"
                                }`}
                            >
                                <Compass className="w-4 h-4" />
                                Discover
                            </button>
                            <button
                                onClick={() => setActiveTab("rewards")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === "rewards"
                                        ? "bg-white text-black shadow-sm border border-gray-200"
                                        : "text-gray-600 hover:text-black hover:bg-white/50"
                                }`}
                            >
                                <Gift className="w-4 h-4" />
                                Rewards
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="transition-all duration-300">
                        {activeTab === "discover" && <DiscoverMoreTab />}
                        {activeTab === "rewards" && <MoreRewardsTab />}
                    </div>
                </div>
            </div>

            {/* Signup Dialog */}
            <AuthDialog isOpen={isAuthDialogOpen} onClose={handleAuthClose} title="Join OnesToWatch" />
        </div>
    );
}

/* -------------------------------
Tab Components
-------------------------------- */

function DiscoverMoreTab() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-black mb-2">
                    Discover Amazing New Artists
                </h2>
                <p className="text-gray-600 text-base">
                    Explore different ways to find your next favorite artist
                </p>
            </div>

            <div className="grid gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center">
                            <Star className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black text-xl mb-2">
                                Weekly Artist Ratings
                            </h3>
                            <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 px-3 py-1"
                            >
                                Watch & Rate for Points
                            </Badge>
                        </div>
                        <Star className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center">
                            <Music className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black text-xl mb-2">
                                Global Vibes Chart
                            </h3>
                            <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 px-3 py-1"
                            >
                                Mood-Based Discovery
                            </Badge>
                        </div>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black text-xl mb-2">
                                Discovery Charts
                            </h3>
                            <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 px-3 py-1"
                            >
                                Live Rankings
                            </Badge>
                        </div>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MoreRewardsTab() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-black mb-2">
                    Your Rewards & Achievements
                </h2>
                <p className="text-gray-600 text-base">
                    Track your progress and unlock exclusive rewards
                </p>
            </div>

            <div className="grid gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-black text-xl mb-2">
                                September Discovery Reward
                            </h3>
                            <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600 px-3 py-1"
                            >
                                Earn 240 Points for all Nine OnesToWatch Zines!
                            </Badge>
                        </div>
                        <Gift className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}