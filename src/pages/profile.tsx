
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Star, TrendingUp, Award, Eye, BarChart, Settings, ChevronDown, ChevronUp, Sparkles, Target, Gift } from "lucide-react";
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
        console.log("🔍 Profile page useEffect triggered:");
        console.log("  - user:", user?.id ? `ID:${user.id}, username:${user.username}` : "null");
        console.log("  - supabaseUser:", supabaseUser ? `ID:${supabaseUser.id}` : "null");
        console.log("  - profileExists:", profileExists);
        console.log("  - authLoading:", authLoading);
        console.log("  - loading:", loading);
        console.log("  - showProfileSetup:", showProfileSetup);
        
        // Wait for auth to finish loading
        if (authLoading) {
            console.log("✋ Auth still loading, waiting...");
            return;
        }
        
        // Handle different authentication states using the new AuthContext flags
        if (!supabaseUser) {
            // User is not authenticated at all
            console.log("❌ User not authenticated - needs to sign in");
            setLoading(false);
            setError("Please sign in to view your profile.");
            setShowProfileSetup(false);
            return;
        }
        
        if (supabaseUser && !profileExists) {
            // User is authenticated but profile doesn't exist - show setup modal
            console.log("⚠️ User authenticated but no profile exists - showing setup modal");
            setLoading(false);
            setShowProfileSetup(true);
            setError(null);
            setUserHistory(null);
            return;
        }
        
        // FIXED: Check if profile exists, then try to load the user data
        if (supabaseUser && profileExists) {
            // Profile exists - either user data is ready or we need to wait for it
            setShowProfileSetup(false);
            setError(null);
            
            if (user && user.id > 0) {
                // User data is ready, load engagement history
                console.log("✅ Complete profile detected - loading engagement history for user ID:", user.id);
                loadUserProfile(user.id);
                return;
            } else {
                // Profile exists but user data not loaded yet - trigger a refresh
                console.log("🔄 Profile exists but user data not loaded - triggering refresh");
                setLoading(true);
                refreshUserProfile().then(() => {
                    console.log("✅ Profile refresh completed, useEffect should retrigger");
                }).catch((error) => {
                    console.error("❌ Profile refresh failed:", error);
                    setError("Failed to load your profile. Please refresh the page.");
                    setLoading(false);
                });
                return;
            }
        }
        
        // Fallback case - something unexpected happened
        console.log("🤔 Unexpected auth state combination:");
        console.log("  - user ID:", user?.id || "none");
        console.log("  - profileExists:", profileExists);
        console.log("  - supabaseUser:", !!supabaseUser);
        setLoading(false);
        setError("Authentication status unclear. Please try refreshing the page.");
        
    }, [user, supabaseUser, profileExists, authLoading, user?.id, refreshUserProfile]);

    const loadUserProfile = async (profileId: number) => {
        try {
            setLoading(true);
            setError(null);
            console.log("Loading engagement history for user ID:", profileId);
            
            const history = await userProfileService.getUserEngagementHistory(profileId);
            console.log("✅ Successfully loaded user engagement history:", history);
            setUserHistory(history);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
            console.error("❌ Error loading engagement history:", errorMessage, err);
            setError(`Failed to load your profile: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle successful profile setup
    const handleProfileSetupComplete = async () => {
        console.log("🎉 Profile setup completed - starting refresh process...");
        setShowProfileSetup(false);
        
        try {
            console.log("🔄 Calling refreshUserProfile...");
            await refreshUserProfile();
            console.log("✅ Profile state refreshed successfully - useEffect should trigger now");
            
            // Force a small delay to ensure state has propagated
            setTimeout(() => {
                console.log("🔍 Post-refresh state check:");
                console.log("  - user:", user?.id ? `ID:${user.id}` : "null");
                console.log("  - profileExists:", profileExists);
                
                // If profile still doesn't exist after refresh, something went wrong
                if (!profileExists || !user?.id) {
                    console.warn("⚠️ Profile refresh didn't set profileExists=true, falling back to page reload");
                    window.location.reload();
                }
            }, 1000);
            
        } catch (error) {
            console.error("❌ Failed to refresh profile state:", error);
            console.log("🔄 Falling back to page reload");
            window.location.reload();
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

                    {/* Tabs for detailed information */}
                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-blue-600">
                                Discovery Activities
                            </TabsTrigger>
                            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-blue-600">
                                Rewards & Achievements
                            </TabsTrigger>
                        </TabsList>

                        {/* Discovery Activities Tab */}
                        <TabsContent value="activity" className="space-y-4">
                            <Card className="bg-gray-900 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Calendar className="w-5 h-5" />
                                        Current Activities
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Link href="/weekly-ratings" className="block group">
                                        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg p-4 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                                    <Star className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg group-hover:text-green-300 transition-colors">
                                                        Weekly Artist Ratings
                                                    </h3>
                                                    <p className="text-sm text-gray-300 mb-2">Watch & Rate emerging artists and earn points for each</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-green-600 text-white">10 per rating</Badge>
                                                        <Badge variant="outline" className="border-green-500 text-green-400">5 per video</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link href="/vibes" className="block group">
                                        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-lg p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                                                    <TrendingUp className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                                                        Global Vibes Chart
                                                    </h3>
                                                    <p className="text-sm text-gray-300 mb-2">Explore artists by mood and discover new sounds</p>
                                                    <Badge variant="outline" className="border-purple-500 text-purple-400">Exploration</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    <Link href="/discovery-charts" className="block group">
                                        <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-lg p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                                                    <BarChart className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg group-hover:text-orange-300 transition-colors">
                                                        Discovery Charts
                                                    </h3>
                                                    <p className="text-sm text-gray-300 mb-2">Interactive lists and trending artist rankings</p>
                                                    <Badge variant="outline" className="border-orange-500 text-orange-400">Rankings</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Achievements Tab */}
                        <TabsContent value="achievements" className="space-y-4">
                            <Card className="bg-gray-900 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Award className="w-5 h-5" />
                                        Your Achievements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Current Monthly Reward */}
                                    <SeptemberReward totalPoints={total_points} />

                                    {/* Achievement Badges */}
                                    {weeksActive >= 3 && (
                                        <div className="bg-gray-800 rounded-lg p-4 border border-green-500/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                                                    <Star className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">Consistent Explorer</h3>
                                                    <p className="text-sm text-gray-400">
                                                        Active for {weeksActive} weeks - keep it up!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {totalVideos >= 10 && (
                                        <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                                                    <Eye className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">Music Discoverer</h3>
                                                    <p className="text-sm text-gray-400">
                                                        Watched {totalVideos} artist videos
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Coming Soon Achievement */}
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/50 opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                                                <Award className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-400">More rewards coming soon...</h3>
                                                <p className="text-sm text-gray-500">
                                                    Keep discovering to unlock new achievements!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* OTW Staff Portal */}
                    {user?.role === 'otwstaff' && (
                        <Card className="bg-gray-900 border-gray-700 border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Settings className="w-5 h-5 text-blue-500" />
                                    OTW Staff Portal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-400 text-sm">
                                    Access exclusive staff tools and content management features.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => window.location.href = "/brandfolder-upload"}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        Submit Content
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = "/discovery-charts"}
                                        className="w-full bg-transparent text-white hover:bg-gray-800"
                                    >
                                        Engagement Pipeline
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
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
                  <h4 className="font-semibold text-white mb-2">Start Your Discovery Journey</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Rate emerging artists weekly, watch their videos, and earn points toward exclusive rewards. 
                    Each activity gets you closer to amazing prizes!
                  </p>
                  <Link href="/weekly-ratings">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                      Watch & Rate This Week's Artists
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
                            <p className="text-sm text-gray-200 mb-3">
                                Earn {goal} points this month and we'll mail you all 9 OnesToWatch zines!
                            </p>
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