
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Star, TrendingUp, Award, Eye, BarChart, Settings, ChevronDown, ChevronUp, Sparkles, Target, Gift, Compass, Zap } from "lucide-react";
import userProfileService from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";
import Link from "next/link";
import ProfileSetupModal from "@/components/ProfileSetupModal";

export default function ProfilePage() {
    const { user, supabaseUser, profileExists, loading: authLoading, refreshUserProfile } = useAuth();
    const [userHistory, setUserHistory] = useState<UserEngagementHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showProfileSetup, setShowProfileSetup] = useState(false);

    useEffect(() => {
        console.log("🔍 Profile page useEffect triggered");
        console.log("  - user:", user?.auth_id);
        console.log("  - supabaseUser:", supabaseUser?.id);
        console.log("  - profileExists:", profileExists);
        console.log("  - authLoading:", authLoading);

        // Wait for auth to finish loading
        if (authLoading) return;

        // User not signed in
        if (!supabaseUser) {
            setError("Please sign in to view your profile.");
            setLoading(false);
            return;
        }

        // Authenticated but profile missing
        if (profileExists === false) {
            setUserHistory(null);
            setError(null);
            setLoading(false);
            return;
        }

        // Profile exists, fetch user history only if not loaded
        const shouldLoadProfile = profileExists === true && user?.auth_id && !userHistory;
        if (!shouldLoadProfile) {
            setLoading(false);
            return;
        }

        const fetchUserHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const history = await userProfileService.getUserEngagementHistory(user.auth_id);
                setUserHistory(history);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };


        fetchUserHistory();

    }, [supabaseUser, profileExists, authLoading, user?.auth_id]);


    // ✅ FIXED: New function to load user profile using auth_id (UUID)
   

    // Handle successful profile setup
    const handleProfileSetupComplete = async () => {
        console.log("🎉 Profile setup completed - starting refresh process...");
        setShowProfileSetup(false);
        
        try {
            console.log("🔄 Calling refreshUserProfile...");
            await refreshUserProfile();
            console.log("✅ Profile state refreshed successfully - useEffect should handle the rest");
            
        } catch (error) {
            console.error("❌ Failed to refresh profile state:", error);
            setError("Failed to refresh profile. Please try refreshing the page.");
        }
    };

    // Show loading while auth is initializing
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        {authLoading ? "Loading..." : "Loading your profile..."}
                    </h1>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    // Show profile setup modal for authenticated users without profiles
    if (supabaseUser && !profileExists) {
        return (
            <>
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-6">
                        <h1 className="text-2xl font-bold mb-4">Welcome to OnesToWatch!</h1>
                        <p className="text-xl text-green-400 mb-4">Let's set up your profile</p>
                        <p className="text-gray-400 mb-6">
                            Complete your profile setup to start earning points and accessing all features!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={() => window.location.href = "/"} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                Go Home
                            </Button>
                            <Button 
                                onClick={() => setShowProfileSetup(true)} 
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Set Up Profile
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Profile Setup Modal */}
                <ProfileSetupModal 
                    isOpen={showProfileSetup} 
                    onClose={() => setShowProfileSetup(false)}
                    onSuccess={handleProfileSetupComplete}
                />
            </>
        );
    }

    // Show error state for authentication issues or loading errors
    if (!supabaseUser || error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <h1 className="text-2xl font-bold mb-4">
                        {!supabaseUser ? "Authentication Required" : "Profile Error"}
                    </h1>
                    <p className="text-xl text-red-400 mb-4">{error || "Authentication required"}</p>
                    <p className="text-gray-400 mb-6">
                        {!supabaseUser ? 
                            "Please sign in to view your profile." :
                            "There was an issue loading your profile data."
                        }
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => window.location.href = "/"} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                            Go Home
                        </Button>
                        {!supabaseUser && (
                            <Button 
                                onClick={() => window.location.href = "/"} 
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // If we get here, user should have a complete profile and userHistory should be loaded
    if (!userHistory) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Loading your profile...</h1>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    const { user_profile, weekly_summaries, total_points } = userHistory;
    const isNewUser = total_points === 0 && weekly_summaries.length === 0;

    // Calculate stats for compact header
    const totalVotes = weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0);
    const totalVideos = weekly_summaries.reduce((sum, week) => sum + week.video_views, 0);
    const weeksActive = weekly_summaries.length;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-black text-white">
                {/* Compact Header with Profile Info & Stats Scoreboard */}
                <div className="sticky top-0 bg-black z-10 border-b border-gray-800">
                    <div className="max-w-2xl mx-auto p-4">
                        {/* Profile Name & Total Points */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                        {user_profile.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{user_profile.username}</h1>
                                    <p className="text-sm text-blue-400 font-medium">{total_points} Total Points</p>
                                </div>
                            </div>
                            
                            {/* Compact Stats Scoreboard */}
                            <div className="flex items-center gap-4 text-xs">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-400">{totalVotes}</div>
                                    <div className="text-gray-400">Votes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-purple-400">{totalVideos}</div>
                                    <div className="text-gray-400">Videos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-400">{weeksActive}</div>
                                    <div className="text-gray-400">Weeks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 max-w-2xl mx-auto space-y-6">
                    {/* Featured Activity Module */}
                    <FeaturedActivityModule isNewUser={isNewUser} />

                    {/* September Reward Module */}
                    <SeptemberReward totalPoints={total_points} />

                    {/* Discovery Action Buttons */}
                    <div className="space-y-4">
                        <div className="text-center mb-2">
                            <p className="text-sm text-gray-400">Ready to discover more?</p>
                        </div>
                        
                        {/* Discover More Button */}
                        <Link href="/discovery-dashboard" className="block group">
                            <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/60 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm shadow-lg shadow-blue-900/20">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center group-hover:from-blue-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-blue-500/25 group-hover:scale-110">
                                        <Compass className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-xl group-hover:text-blue-300 transition-colors mb-2">
                                            Discover More
                                        </h3>
                                        <p className="text-gray-300 mb-3 group-hover:text-blue-100 transition-colors">
                                            Explore all discovery activities, artist ratings, and interactive charts in one place
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                            <span className="text-sm text-blue-300 font-medium">Weekly Artists • Global Vibes • Live Charts</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-1">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* More Rewards Button */}
                        <Link href="/discovery-dashboard?tab=rewards" className="block group">
                            <div className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/60 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm shadow-lg shadow-purple-900/20">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-pink-400 transition-all shadow-lg shadow-purple-500/25 group-hover:scale-110">
                                        <Gift className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors mb-2">
                                            More Rewards
                                        </h3>
                                        <p className="text-gray-300 mb-3 group-hover:text-purple-100 transition-colors">
                                            Track your achievements, progress towards rewards, and unlock exclusive content
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                            <span className="text-sm text-purple-300 font-medium">Achievements • Progress • Exclusive Rewards</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-1">
                                        <Trophy className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                </div>
            </div>
        </AuthGuard>
    );
}

// Featured Activity Module Component
function FeaturedActivityModule({ isNewUser = false }: { isNewUser?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(isNewUser);

  return (
    <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30 overflow-hidden">
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer flex items-center justify-between hover:bg-blue-900/20 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isNewUser ? "🎉 Welcome to OnesToWatch!" : "⭐ Featured Activity"}
              </h3>
              <p className="text-sm text-blue-200">
                {isNewUser ? "Let's get you started on your discovery journey" : "Discover new artists and earn rewards"}
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-300" /> : <ChevronDown className="w-5 h-5 text-blue-300" />}
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-black/20 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Target className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">September Discovery Reward</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Earn 180 points by watching videos and rating artists and you'll receive all nine OntesToWatch Zines! 
                  </p>
                  <Link href="/weekly-ratings">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                      Discover This Week's Artists
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

           
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// September Reward Component
function SeptemberReward({ totalPoints }: { totalPoints: number }) {
    const goal = 180;
    const isComplete = totalPoints >= goal;
    const progress = Math.min((totalPoints / goal) * 100, 100);

    return (
        <div
            className={`rounded-lg p-4 transition-all ${
                isComplete
                    ? "bg-gradient-to-r from-green-800/80 to-emerald-800/80 border border-green-500/50"
                    : "bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/30"
            }`}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-500/20"
                            : "bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300"
                    }`}
                >
                    {isComplete ? <Gift className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">September Discovery Reward</h3>
                    {!isComplete ? (
                        <>
                           
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-2">
                                <div
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-300">
                                    {totalPoints} / {goal} points
                                </span>
                                <span className="text-xs font-medium text-yellow-400">
                                    {Math.round(progress)}% complete
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-green-200 font-semibold">
                                🎉 Completed! Package on the way.
                            </p>
                            <Badge className="bg-green-500 text-white">Complete!</Badge>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}