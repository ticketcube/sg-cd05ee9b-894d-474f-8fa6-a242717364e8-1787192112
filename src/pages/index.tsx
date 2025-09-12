
    import { useState, useEffect, useRef } from "react";
    import { useRouter } from "next/router";
    import AuthDialog from "@/components/AuthDialog";
    import { Button } from "@/components/ui/button";
    import { Volume2, VolumeX, Gift, Compass, Star, Trophy } from "lucide-react";
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
            <div className="min-h-screen bg-gray-200">
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
                        className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg"
                    >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                </div>

                {/* Register CTA */}
                <div className="flex justify-center mt-10">
                    <Button
                        onClick={handleRegisterClick}
                        className="bg-red-600 hover:bg-red-700 text-lg px-6 py-3 rounded-xl shadow-lg text-white"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Register to Discover Rewards'}
                    </Button>
                </div>

                {/* Tabs */}
                <div className="max-w-4xl mx-auto px-3 md:px-4 py-8 md:py-12">
                    <div className="flex justify-center mb-6 md:mb-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1.5 border border-white/10 w-full max-w-lg">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab("discover")}
                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-base ${activeTab === "discover"
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Compass className="w-4 h-4 inline mr-2" />
                                    Discover
                                </button>
                                <button
                                    onClick={() => setActiveTab("rewards")}
                                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-base ${activeTab === "rewards"
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Gift className="w-4 h-4 inline mr-2" />
                                    Rewards
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "discover" && <DiscoverMoreTab />}
                    {activeTab === "rewards" && <MoreRewardsTab />}
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
                <div className="grid gap-6">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                                <Star className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-xl mb-2">
                                    Discover Amazing New Artists
                                </h3>
                                <p className="text-gray-400 text-base pb-4">
                                    Explore different ways to find your next favorite artist
                                </p>
                                <div className="flex justify-evenly gap-2 mt-4">
                                <Badge variant="outline" className="border-dark-blue-500 text-dark-blue-400 px-3 py-1">
                                    Weekly Artists Watch, Vote & Earn List
                                </Badge>
                                <Badge variant="outline" className="border-blue-500 text-blue-400 px-3 py-1">
                                    Global Vibes Discovery Matrix
                                </Badge>
                                <Badge variant="outline" className="border-green-500 text-green-400 px-3 py-1">
                                    OTW Trending Artists Chart
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function MoreRewardsTab() {
        return (
            <div className="space-y-6">
                <div className="grid gap-6">
                    <div className="grid gap-6">
                        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                                    <Trophy className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-xl mb-2">
                                        We Reward Discovery
                                    </h3>
                                    <p className="text-gray-400 text-base pb-4">
                                        Earn points for exclusive merch, insider access and even free tix!
                                    </p>
                                    {/* Badges row */}
                                    <div className="flex justify-evenly gap-4 mt-4">
                                        <Badge variant="outline" className="border-blue-500 text-blue-400 px-3 py-1">
                                            September: 240 Points = 9 OTW Zines
                                        </Badge>
                                        <Badge variant="outline" className="border-purple-500 text-purple-400 px-3 py-1">
                                            October: Coming Soon!
                                        </Badge>
                                        <Badge variant="outline" className="border-pink-500 text-pink-400 px-3 py-1">
                                            November: Coming Soon!
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
  