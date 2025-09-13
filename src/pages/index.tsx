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

            {/* Tabs Section: Clean, Compact, Black-on-White */}
            <div className="bg-purple-deep rounded-xl" >
                <div className="max-w-4xl mx-auto px-4 py-4">

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-6">
                        <div className="flex rounded-md border border-purple-deep bg-purple-deep p-1 shadow-sm">
                            <button
                                onClick={() => setActiveTab("discover")}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "discover"
                                        ? "bg-purple-med text-white"
                                        : "text-white hover:bg-gray-100"
                                    }`}
                            >
                                <Compass className="w-4 h-4" />
                                Discover
                            </button>
                            <button
                                onClick={() => setActiveTab("rewards")}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "rewards"
                                    ? "bg-purple-med text-white"
                                        : "text-white hover:bg-gray-100"
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
        <div className="grid gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-lit flex items-center justify-center shadow-lg shadow-green-500/25">
                        <Star className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-lg mb-1">
                            Discover Amazing New Artists
                        </h3>

                        <p className="text-gray-700 text-sm pb-4">
                            Explore different ways to find your next favorite artist.
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                Weekly Artists Watch, Vote & Earn List
                            </Badge>
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                Global Vibes Discovery Matrix
                            </Badge>
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                OTW Trending Artists Chart
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function MoreRewardsTab() {
    return (
        <div className="grid gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-start gap-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-lit flex items-center justify-center shadow-lg shadow-green-500/25">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-lg mb-1">
                            We Reward Discovery
                        </h3>
                        <p className="text-gray-700 text-sm pb-4">
                            Earn points for exclusive merch, insider access and even free tix!
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                September: 240 Points = 9 OTW Zines
                            </Badge>
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                October: Coming Soon!
                            </Badge>
                            <Badge variant="outline" className="border-gray-500 text-black px-3 py-1">
                                November: Coming Soon!
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
