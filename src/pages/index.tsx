
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Gift, Compass, BarChart, Music, Star, TrendingUp, Zap, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";


export default function HomePage() {
  const user = useUser();
  const router = useRouter();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();

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

  // ✅ CRITICAL: Ultra-comprehensive OAuth process detection
  useEffect(() => {
    console.log('🏠 [HomePage] Auth state check:', { 
      user: user?.id, 
      profile: profile?.username, 
      isAuthenticated, 
      profileLoading,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });

    // ✅ CRITICAL: Skip ALL redirect logic if auth dialog is open
    if (isAuthDialogOpen) {
      console.log('🚫 [HomePage] Auth dialog open, skipping redirects');
      return;
    }

    // ✅ ULTRA-ENHANCED: Most comprehensive OAuth detection possible
    const isOAuthCallback = window.location.href.includes('/auth/callback') ||
                          window.location.search.includes('code=') ||
                          window.location.search.includes('state=') ||
                          window.location.hash.includes('access_token') ||
                          window.location.hash.includes('refresh_token') ||
                          window.location.pathname.includes('/auth/') ||
                          document.referrer.includes('accounts.google.com');
    
    // ✅ CRITICAL: Check for ANY OAuth-related process or recent activity
    const isOAuthRedirectInProgress = sessionStorage.getItem('oauth_redirect_in_progress') ||
                                    sessionStorage.getItem('oauth_user_data') ||
                                    sessionStorage.getItem('oauth_callback_complete') ||
                                    window.location.pathname === '/auth/setup-profile' ||
                                    window.location.pathname === '/auth/callback';
    
    // ✅ CRITICAL: Check for recent OAuth activity (within last 10 seconds)
    const recentOAuthActivity = sessionStorage.getItem('oauth_callback_complete');
    const isRecentOAuth = recentOAuthActivity && 
                         (Date.now() - parseInt(recentOAuthActivity)) < 10000;
    
    // ✅ CRITICAL: Also check if we're currently on an auth page or just came from one
    const isOnAuthPage = window.location.pathname.startsWith('/auth/');
    
    if (isOAuthCallback || isOAuthRedirectInProgress || isOnAuthPage || isRecentOAuth) {
      console.log('🚫 [HomePage] OAuth/Auth process active or recent, completely skipping all redirects');
      console.log('🚫 [HomePage] Detection reasons:', {
        isOAuthCallback,
        isOAuthRedirectInProgress,
        isOnAuthPage,
        isRecentOAuth,
        referrer: document.referrer
      });
      return;
    }

    // ✅ SIMPLIFIED: Only redirect authenticated users with complete profiles
    if (user && isAuthenticated && profile && !profileLoading) {
      console.log('✅ [HomePage] Complete authenticated user, redirecting to dashboard');
      router.replace("/discovery-dashboard");
      return;
    }
    
    // ✅ SIMPLIFIED: Don't interfere with OAuth process - database trigger handles profile creation
    if (user && !profile && !profileLoading) {
      console.log('⚠️ [HomePage] User without profile - OAuth callback or database trigger will handle');
      // Don't redirect - let OAuth callback handle the flow
    }
  }, [user, isAuthenticated, profile, profileLoading, isAuthDialogOpen, router]);

  // ✅ SIMPLIFIED: Minimal loading state that doesn't interfere with OAuth
  if (profileLoading && user && !profile) {
    // Very brief loading state
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
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
        </div >
     </div >
  );
}

/* -------------------------------
   Tab Components (added here)
-------------------------------- */

// Discover Tab
function DiscoverMoreTab() {
  return (
      <div className="grid gap-6">
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] backdrop-blur-sm">
          <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                 <Star className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-xl group-hover:text-green-300 transition-colors mb-2">Discover Amazing New Artists
                      </h3>
                 <p className="text-gray-400 text-base">
                          Explore different ways to find your next favorite artist
                      </p>
                <br>
             <div className="flex items-center gap-6">
                <Badge
                variant="outline"
                className="border-green-500 text-green-400 px-3 py-1">
                    Watch & Rate for Points
                </Badge>
                <Badge
                variant="outline"
                className="border-purple-500 text-purple-400 px-3 py-1">
                    Mood-Based Discovery
                </Badge>
                <Badge
                variant="outline"
                className="border-orange-500 text-orange-400 px-3 py-1">
                    Live Rankings
                </Badge>
            </div>   
             
            </div>
            <TrendingUp className="w-4 h-4 text-white" />
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
  );
}
