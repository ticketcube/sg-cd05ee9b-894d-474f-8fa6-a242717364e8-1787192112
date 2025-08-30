import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Gift, Compass, BarChart, Music, Star, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client"; // ✅ make sure this path matches your setup

export default function HomePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("discover");
    const [videoUrl, setVideoUrl] = useState < string | null > (null);

    // 🔄 Fetch video dynamically from Supabase
    useEffect(() => {
        const fetchVideo = async () => {
            const { data, error } = await supabase
                .from("artists")
                .select("artist_videolink")
                .is("artist_videolink", null, false) // ignore nulls
                .limit(1);

            if (error) {
                console.error("Error fetching video:", error.message);
            } else if (data && data.length > 0) {
                setVideoUrl(data[0].artist_videolink);
            }
        };

        fetchVideo();
    }, []);

    const handleRegisterClick = () => {
        if (user) {
            router.push("/discoverydashboard");
        } else {
            setAuthDialogOpen(true);
        }
    };

    const handleAuthClose = () => {
        setAuthDialogOpen(false);
    };

    useEffect(() => {
        if (user && isAuthDialogOpen === false) {
            router.push("/discoverydashboard");
        }
    }, [user, isAuthDialogOpen, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Hero Video Header */}
            <div className="relative overflow-hidden">
                {videoUrl ? (
                    <video
                        className="w-full h-[60vh] object-cover"
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/video-poster.jpg" // optional placeholder image
                    />
                ) : (
                    <div className="w-full h-[60vh] bg-black flex items-center justify-center text-gray-400">
                        Loading video...
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button
                        onClick={handleRegisterClick}
                        className="bg-blue-600 hover:bg-blue-700 text-lg px-6 py-3 rounded-xl shadow-lg"
                    >
                        Register to Discover Rewards
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-3 md:px-4 py-8 md:py-12">
                {/* Tabs */}
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
                {activeTab === "rewards" && (
                    <MoreRewardsTab totalPoints={0} weeksActive={0} totalVideos={0} />
                )}
            </div>

            {/* Signup Dialog */}
            <AuthDialog
                isOpen={isAuthDialogOpen}
                onClose={handleAuthClose}
                title="Join OnesToWatch"
            />
        </div>
    );
}
