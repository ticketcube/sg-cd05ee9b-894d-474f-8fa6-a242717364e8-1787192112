
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useAuth } from "@/contexts/AuthContext";
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
    const { user, supabaseUser, profileExists, loading: authLoading } = useAuth();
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
        if (authLoading) return;

        if (!supabaseUser) {
            setError("Please sign in to access the discovery dashboard.");
            setLoading(false);
            return;
        }

        if (profileExists === false) {
            setUserHistory(null);
            setError(null);
            setLoading(false);
            return;
        }

        if (profileExists === true && user?.auth_id && !userHistory) {
            const fetchUserHistory = async () => {
                setLoading(true);
                setError(null);
                try {
                    const history = await userProfileService.getUserEngagementHistory(user.auth_id);
                    setUserHistory(history);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to load dashboard data");
                } finally {
                    setLoading(false);
                }
            };

            fetchUserHistory();
        } else {
            setLoading(false);
        }
    }, [supabaseUser, profileExists, authLoading, user?.auth_id]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold mb-2">Loading Discovery Dashboard</h1>
                    <p className="text-gray-400">Preparing your personalized experience...</p>
                </div>
            </div>
        );
    }

    if (!supabaseUser || error || !userHistory) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                        <Compass className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Access Required</h1>
                    <p className="text-red-400 mb-6">{error || "Please complete your profile setup first."}</p>
                    <Link href="/profile">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Back to Profile
                        </Button>
                    </Link>
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
                {/* Hero Header */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
                    
                    <div className="relative max-w-4xl mx-auto px-4 py-12">
                       

                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-medium">Discovery Dashboard</span>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Welcome back, {user_profile.username}!
                            </h1>
                            <p className="text-xl text-gray-300 mb-8">
                                Your gateway to discovering amazing new artists and earning rewards
                            </p>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{total_points}</div>
                                    <div className="text-sm text-gray-400">Total Points</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                                        <Star className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{totalVotes}</div>
                                    <div className="text-sm text-gray-400">Artist Ratings</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{totalVideos}</div>
                                    <div className="text-sm text-gray-400">Videos Watched</div>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:scale-105">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{weeksActive}</div>
                                    <div className="text-sm text-gray-400">Weeks Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 pb-12">
                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab("discover")}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                                        activeTab === "discover"
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Compass className="w-4 h-4 inline mr-2" />
                                    Discover More
                                </button>
                                <button
                                    onClick={() => setActiveTab("rewards")}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all ${
                                        activeTab === "rewards"
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Gift className="w-4 h-4 inline mr-2" />
                                    More Rewards
                                </button>
                                {user?.role === 'otwstaff' && (
                                    <button
                                        onClick={() => setActiveTab("staff")}
                                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                                            activeTab === "staff"
                                                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        <Settings className="w-4 h-4 inline mr-2" />
                                        Staff Portal
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "discover" && <DiscoverMoreTab />}
                    {activeTab === "rewards" && <MoreRewardsTab totalPoints={total_points} weeksActive={weeksActive} totalVideos={totalVideos} />}
                    {activeTab === "staff" && user?.role === 'otwstaff' && <StaffPortalTab />}
                </div>
            </div>
        </AuthGuard>
    );
}

// Discover More Tab Component
function DiscoverMoreTab() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Discover Amazing New Artists</h2>
                <p className="text-gray-400">Explore different ways to find your next favorite artist</p>
            </div>

            <div className="grid gap-6">
                {/* Weekly Artist Ratings */}
                <Link href="/weekly-ratings" className="block group">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:from-green-400 group-hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25">
                                <Star className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-xl group-hover:text-green-300 transition-colors mb-2">
                                    Weekly Artist Ratings
                                </h3>
                                <p className="text-gray-300 mb-4">Watch & Rate emerging artists and earn points for each discovery</p>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-green-600 text-white px-3 py-1">10 per rating</Badge>
                                    <Badge variant="outline" className="border-green-500 text-green-400 px-3 py-1">5 per video</Badge>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Global Vibes Chart */}
                <Link href="/vibes" className="block group">
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/25">
                                <Music className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors mb-2">
                                    Global Vibes Chart
                                </h3>
                                <p className="text-gray-300 mb-4">Explore artists by mood and discover new sounds that match your vibe</p>
                                <Badge variant="outline" className="border-purple-500 text-purple-400 px-3 py-1">Mood-Based Discovery</Badge>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Discovery Charts */}
                <Link href="/discovery-charts" className="block group">
                    <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-2xl p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:from-orange-400 group-hover:to-red-400 transition-all shadow-lg shadow-orange-500/25">
                                <BarChart className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-xl group-hover:text-orange-300 transition-colors mb-2">
                                    Discovery Charts
                                </h3>
                                <p className="text-gray-300 mb-4">Interactive lists and trending artist rankings updated in real-time</p>
                                <Badge variant="outline" className="border-orange-500 text-orange-400 px-3 py-1">Live Rankings</Badge>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

// More Rewards Tab Component
function MoreRewardsTab({ totalPoints, weeksActive, totalVideos }: { totalPoints: number; weeksActive: number; totalVideos: number }) {
    const goal = 180;
    const isComplete = totalPoints >= goal;
    const progress = Math.min((totalPoints / goal) * 100, 100);

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Your Rewards & Achievements</h2>
                <p className="text-gray-400">Track your progress and unlock exclusive rewards</p>
            </div>

            {/* Current Monthly Reward */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-2xl p-6 border border-yellow-500/30 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                        isComplete
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-yellow-500/25"
                            : "bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 shadow-gray-600/25"
                    }`}>
                        {isComplete ? <Gift className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-white text-xl mb-2">September Discovery Reward</h3>
                        <p className="text-gray-300 mb-4">Earn 180 points to receive all nine OnesToWatch Zines!</p>
                        
                        {!isComplete ? (
                            <>
                                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-3">
                                    <div
                                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 transition-all duration-500 ease-out rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-300">
                                        {totalPoints} / {goal} points
                                    </span>
                                    <span className="text-sm font-medium text-yellow-400">
                                        {Math.round(progress)}% complete
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Badge className="bg-green-500 text-white px-3 py-1">Completed!</Badge>
                                <span className="text-green-200 font-semibold">
                                    🎉 Package on the way!
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Achievement Cards */}
            <div className="grid gap-4">
                <h3 className="text-lg font-semibold text-white mb-2">Your Achievements</h3>
                
                {weeksActive >= 3 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                                <Star className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-lg">Consistent Explorer</h4>
                                <p className="text-gray-400">
                                    Active for {weeksActive} weeks - keep up the great work!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {totalVideos >= 10 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Eye className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-lg">Music Discoverer</h4>
                                <p className="text-gray-400">
                                    Watched {totalVideos} artist videos and counting!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coming Soon */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 opacity-75">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                            <Award className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 text-lg">More Rewards Coming Soon</h4>
                            <p className="text-gray-500">
                                Keep discovering to unlock new achievements and exclusive rewards!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}