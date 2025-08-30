import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Gift, Compass, BarChart, Music, Star, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client"; // make sure this exists

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideo = async () => {
            const { data, error } = await supabase
                .from("artists")
                .select("artist_videolink")
                .eq("artist_name", "otw")
                .single();

            if (error) {
                console.error("Error fetching video:", error.message);
            } else if (data?.artist_videolink) {
                setVideoUrl(data.artist_videolink);
            } else {
                console.warn("No video found for artist 'otw'");
            }
        };

        fetchVideo();
    }, []);

  const handleRegisterClick = () => {
    if (user) {
      router.push("/discovery-dashboard");
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
            poster="/video-poster.jpg" // optional
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
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-base ${
                  activeTab === "discover"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Compass className="w-4 h-4 inline mr-2" />
                Discover
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all text-base ${
                  activeTab === "rewards"
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

/* -------------------------------
   Tab Components (added here)
-------------------------------- */

// Discover Tab
function DiscoverMoreTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Discover Amazing New Artists
        </h2>
        <p className="text-gray-400 text-base">
          Explore different ways to find your next favorite artist
        </p>
      </div>

      <div className="grid gap-6">
        <Link href="/weekly-ratings" className="block group">
          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Star className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-xl group-hover:text-green-300 transition-colors mb-2">
                  Weekly Artist Ratings
                </h3>
                <p className="text-gray-300 mb-4">
                  Watch & Rate emerging artists and earn points
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    10 per rating
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-400 px-3 py-1"
                  >
                    5 per video
                  </Badge>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
        </Link>

        <Link href="/vibes" className="block group">
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Music className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors mb-2">
                  Global Vibes Chart
                </h3>
                <p className="text-gray-300 mb-4">
                  Explore artists by mood and discover new sounds
                </p>
                <Badge
                  variant="outline"
                  className="border-purple-500 text-purple-400 px-3 py-1"
                >
                  Mood-Based Discovery
                </Badge>
              </div>
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        </Link>

        <Link href="/discovery-charts" className="block group">
          <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <BarChart className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-xl group-hover:text-orange-300 transition-colors mb-2">
                  Discovery Charts
                </h3>
                <p className="text-gray-300 mb-4">
                  Interactive lists and trending artist rankings
                </p>
                <Badge
                  variant="outline"
                  className="border-orange-500 text-orange-400 px-3 py-1"
                >
                  Live Rankings
                </Badge>
              </div>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Rewards Tab
function MoreRewardsTab({
  totalPoints,
  weeksActive,
  totalVideos,
}: {
  totalPoints: number;
  weeksActive: number;
  totalVideos: number;
}) {
  return (
    <div className="text-center text-gray-300">
      <h2 className="text-2xl font-bold text-white mb-4">Rewards Preview</h2>
      <p className="mb-2">Earn points by discovering artists!</p>
      <p className="mb-2">Sign up to unlock rewards.</p>
    </div>
  );
}
