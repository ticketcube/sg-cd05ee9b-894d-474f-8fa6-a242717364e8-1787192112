import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Star, TrendingUp, Award, Eye, BarChart, ArrowLeft, Sparkles, Target, Gift, Music, Zap, Compass, Settings, Upload, Map } from "lucide-react";
import userProfileService from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";
import Link from "next/link";
import StaffPortalTab from "@/components/StaffPortalTab";

export default function DiscoveryDashboard() {
    const router = useRouter();
    const user = useUser();
    const { profile, role, loading: profileLoading } = useUserProfile();
    const [userHistory, setUserHistory] = useState<UserEngagementHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("discover");

    useEffect(() => {
        // Set initial tab based on URL parameter
        const { tab } = router.query;
        if (tab === 'rewards') {
            setActiveTab('rewards');
        } else {
            setActiveTab('discover');
        }
    }, [router.query]);


    useEffect(() => {
                // Don’t decide anything until profile AND user have finished loading
                   if (profileLoading) return;
        
                    // If auth hasn’t resolved yet, don’t show an error
                    if (user === null) {
                            setError("Please sign in to access the discovery dashboard.");
                            setLoading(false);
                            return;
                        }
        
                    // Profile check after loading finishes
                    if (!profile) {
                            setUserHistory(null);
                          setError("Please complete your profile setup first.");
                          setLoading(false);
                           return;
                       }
        
                  // Fetch history only once, after both user + profile exist
                    if (user?.id && profile && !userHistory) {
                           const fetchUserHistory = async () => {
                                    setLoading(true);
                                  setError(null);
                                    try {
                                            // IMPORTANT: use user.id (auth id), not profile!.id
                                                const history = await userProfileService.getUserEngagementHistory(user.id);
                                            setUserHistory(history);
                                       } catch (err) {
                                                setError(err instanceof Error ? err.message : "Failed to load dashboard data");
                                           } finally {
                                            setLoading(false);
                                        }
                               };
                            fetchUserHistory();
                        }
            }, [user?.id, profile, profileLoading, userHistory]);

    if (profileLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 md:w-16 h-12 md:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h1 className="text-xl md:text-2xl font-bold mb-2">Loading Discovery Dashboard</h1>
                    <p className="text-gray-400 text-sm md:text-base">Preparing your personalized experience...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-bold mb-4">Access Required</h1>
                    <p className="text-red-400 mb-6 text-sm md:text-base">
                        Please sign in to access the discovery dashboard.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-bold mb-4">Error</h1>
                    <p className="text-red-400 mb-6 text-sm md:text-base">{error}</p>
                    <Link href="/profile">
                        <Button>Back to Profile</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!userHistory) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-bold mb-4">No history yet</h1>
                    <p className="text-gray-400 mb-6 text-sm md:text-base">
                        Start discovering events to see your history here.
                    </p>
                </div>
            </div>
        );
    }


    const { user_profile, weekly_summaries, total_points } = userHistory;
    
    // Calculate stats
    const totalVotes = weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0);
    const totalVideos = weekly_summaries.reduce((sum, week) => sum + week.video_views, 0);
    const weeksActive = weekly_summaries.length;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
                {/* Hero Header - Mobile Optimized */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
                    
                    <div className="relative max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-12">
                        <div className="text-center mb-6 md:mb-12">
                            <div className="inline-flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-sm rounded-full px-3 md:px-6 py-2 md:py-3 mb-4 md:mb-6 border border-white/10">
                                <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-white" />
                                </div>
                                <span className="text-white font-medium text-sm md:text-base">Discovery Dashboard</span>
                            </div>
                            
                            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2">
                                Welcome back, {user_profile.username}!
                            </h1>
                            <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 px-4">
                                Your gateway to discovering amazing new artists and earning rewards
                            </p>

                            {/* Stats Cards - Mobile Optimized */}
                            <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-3xl mx-auto">

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-8 md:w-12 h-8 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-2 md:mb-3">
                                        <Trophy className="w-4 md:w-6 h-4 md:h-6 text-white" />
                                    </div>
                                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{total_points}</div>
                                    <div className="text-xs md:text-sm text-gray-400">Total Points</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-8 md:w-12 h-8 md:h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-2 md:mb-3">
                                        <Star className="w-4 md:w-6 h-4 md:h-6 text-white" />
                                    </div>
                                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{totalVotes}</div>
                                    <div className="text-xs md:text-sm text-gray-400">Artist Ratings</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-8 md:w-12 h-8 md:h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-2 md:mb-3">
                                        <Eye className="w-4 md:w-6 h-4 md:h-6 text-white" />
                                    </div>
                                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{totalVideos}</div>
                                    <div className="text-xs md:text-sm text-gray-400">Videos Watched</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-8 md:w-12 h-8 md:h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-2 md:mb-3">
                                        <Calendar className="w-4 md:w-6 h-4 md:h-6 text-white" />
                                    </div>
                                    <div className="text-lg md:text-2xl font-bold text-white mb-1">{weeksActive}</div>
                                    <div className="text-xs md:text-sm text-gray-400">Weeks Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Mobile Optimized */}
                <div className="max-w-4xl mx-auto px-3 md:px-4 pb-8 md:pb-12">
                    {/* Tab Navigation - Mobile Optimized */}
                    <div className="flex justify-center mb-6 md:mb-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-white/10 w-full max-w-lg">
                            <div className="flex gap-1 md:gap-2">
                                <button
                                    onClick={() => setActiveTab("discover")}
                                    className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
                                        activeTab === "discover"
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Compass className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                                    <span className="hidden sm:inline">Discover More</span>
                                    <span className="sm:hidden">Discover</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("rewards")}
                                    className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
                                        activeTab === "rewards"
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Gift className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                                    <span className="hidden sm:inline">More Rewards</span>
                                    <span className="sm:hidden">Rewards</span>
                                </button>
                                {role === 'otwstaff' && (
                                    <button
                                        onClick={() => setActiveTab("staff")}
                                        className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
                                            activeTab === "staff"
                                                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        <Settings className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                                        <span className="hidden sm:inline">Staff Portal</span>
                                        <span className="sm:hidden">Staff</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "discover" && <DiscoverMoreTab />}
                    {activeTab === "rewards" && <MoreRewardsTab totalPoints={total_points} weeksActive={weeksActive} totalVideos={totalVideos} />}
                    {activeTab === "staff" && role === 'otwstaff' && <StaffPortalTab />}
                </div>
            </div>
        </AuthGuard>
    );
}

// Discover More Tab Component - Mobile Optimized
function DiscoverMoreTab() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Discover Amazing New Artists</h2>
                <p className="text-gray-400 text-sm md:text-base px-4">Explore different ways to find your next favorite artist</p>
            </div>

            <div className="grid gap-4 md:gap-6">
                {/* Weekly Artist Ratings - Mobile Optimized */}
                <Link href="/weekly-ratings" className="block group">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:from-green-400 group-hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25 flex-shrink-0">
                                <Star className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-green-300 transition-colors mb-1 md:mb-2">
                                    Weekly Artist Ratings
                                </h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Watch & Rate emerging artists and earn points for each discovery</p>
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                    <Badge className="bg-green-600 text-white px-2 md:px-3 py-1 text-xs md:text-sm">10 per rating</Badge>
                                    <Badge variant="outline" className="border-green-500 text-green-400 px-2 md:px-3 py-1 text-xs md:text-sm">5 per video</Badge>
                                </div>
                            </div>
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                                <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Global Vibes Chart - Mobile Optimized */}
                <Link href="/vibes" className="block group">
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/25 flex-shrink-0">
                                <Music className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-purple-300 transition-colors mb-1 md:mb-2">
                                    Global Vibes Chart
                                </h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Explore artists by mood and discover new sounds that match your vibe</p>
                                <Badge variant="outline" className="border-purple-500 text-purple-400 px-2 md:px-3 py-1 text-xs md:text-sm">Mood-Based Discovery</Badge>
                            </div>
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                                <Zap className="w-3 md:w-4 h-3 md:h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Discovery Charts - Mobile Optimized */}
                <Link href="/discovery-charts" className="block group">
                    <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:from-orange-400 group-hover:to-red-400 transition-all shadow-lg shadow-orange-500/25 flex-shrink-0">
                                <BarChart className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-orange-300 transition-colors mb-1 md:mb-2">
                                    Discovery Charts
                                </h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Interactive lists and trending artist rankings updated in real-time</p>
                                <Badge variant="outline" className="border-orange-500 text-orange-400 px-2 md:px-3 py-1 text-xs md:text-sm">Live Rankings</Badge>
                            </div>
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                                <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

// More Rewards Tab Component - Mobile Optimized
function MoreRewardsTab({ totalPoints, weeksActive, totalVideos }: { totalPoints: number; weeksActive: number; totalVideos: number }) {
    const goal = 240;
    const isComplete = totalPoints >= goal;
    const progress = Math.min((totalPoints / goal) * 100, 100);

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Your Rewards & Achievements</h2>
                <p className="text-gray-400 text-sm md:text-base px-4">Track your progress and unlock exclusive rewards</p>
            </div>

            {/* Current Monthly Reward - Mobile Optimized */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-3 md:gap-6">
                    <div className={`w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-lg flex-shrink-0 ${
                        isComplete
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-yellow-500/25"
                            : "bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 shadow-gray-600/25"
                    }`}>
                        {isComplete ? <Gift className="w-7 md:w-10 h-7 md:h-10" /> : <Trophy className="w-7 md:w-10 h-7 md:h-10" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg md:text-xl mb-1 md:mb-2">September Discovery Reward</h3>
                        <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Earn 240 points to receive all nine OnesToWatch Zines!</p>
                        
                        {!isComplete ? (
                            <>
                                <div className="w-full bg-gray-800 rounded-full h-2 md:h-3 overflow-hidden mb-2 md:mb-3">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 md:h-3 transition-all duration-500 ease-out rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs md:text-sm text-gray-300">
                                        {totalPoints} / {goal} points
                                    </span>
                                    <span className="text-xs md:text-sm font-medium text-yellow-400">
                                        {Math.round(progress)}% complete
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <Badge className="bg-green-500 text-white px-2 md:px-3 py-1 text-xs md:text-sm">Completed!</Badge>
                                <span className="text-green-200 font-semibold text-sm md:text-base">
                                    🎉 Package on the way!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Achievement Cards - Mobile Optimized */}
            <div className="grid gap-3 md:gap-4">
                <h3 className="text-lg font-semibold text-white mb-1 md:mb-2">Your Achievements</h3>
                
                {weeksActive >= 3 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-500/30">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 flex-shrink-0">
                                <Star className="w-6 md:w-8 h-6 md:h-8 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold text-white text-base md:text-lg">Consistent Explorer</h4>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Active for {weeksActive} weeks - keep up the great work!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {totalVideos >= 10 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/30">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                                <Eye className="w-6 md:w-8 h-6 md:h-8 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold text-white text-base md:text-lg">Music Discoverer</h4>
                                <p className="text-gray-400 text-sm md:text-base">
                                    Watched {totalVideos} artist videos and counting!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coming Soon - Mobile Optimized */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-600/30 opacity-75">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 md:w-8 h-6 md:h-8 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-300 text-base md:text-lg">More Rewards Coming Soon</h4>
                            <p className="text-gray-500 text-sm md:text-base">
                                Keep discovering to unlock new achievements and exclusive rewards!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}