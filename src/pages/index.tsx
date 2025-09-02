import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Gift, Compass, BarChart, Music, Star, TrendingUp, Zap, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function HomePage() {
  const user = useUser();
  const router = useRouter();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleRegisterClick = () => {
    if (user) {
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

  useEffect(() => {
    if (user && isAuthDialogOpen === false) {
      router.push("/discovery-dashboard");
    }
  }, [user, isAuthDialogOpen, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Video Header */}
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

        {/* Custom Unmute/Mute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg transition"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>
      
      {/* Button below video with padding */}
      <div className="flex justify-center mt-10">
        <Button
          onClick={handleRegisterClick}
          className="bg-red-600 hover:bg-red-700 text-lg px-6 py-3 rounded-xl shadow-lg text-white"
        >
          Register to Discover Rewards
        </Button>
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
        {activeTab === "rewards" && <MoreRewardsTab />}
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
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Star className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl group-hover:text-green-300 transition-colors mb-2">
                Weekly Artist Ratings
              </h3>
              <Badge
                variant="outline"
                className="border-green-500 text-green-400 px-3 py-1"
              >
                Watch & Rate for Points
              </Badge>
            </div>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Music className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors mb-2">
                Global Vibes Chart
              </h3>
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

        <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <BarChart className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl group-hover:text-orange-300 transition-colors mb-2">
                Discovery Charts
              </h3>
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
      </div>
    </div>
  );
}

// Rewards Tab
function MoreRewardsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Your Rewards & Achievements
        </h2>
        <p className="text-gray-400 text-base">
          Track your progress and unlock exclusive rewards
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl group-hover:text-green-300 transition-colors mb-2">
                September Discovery Reward
              </h3>
              <Badge
                variant="outline"
                className="border-green-500 text-green-400 px-3 py-1"
              >
                Earn 240 Points for all Nine OnesToWatch Zines!
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}