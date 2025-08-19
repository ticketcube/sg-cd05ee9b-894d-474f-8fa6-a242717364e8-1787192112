import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Trophy, Calendar, Star, TrendingUp, Award, Eye, Vote, Users, BarChart, Settings, RefreshCw } from "lucide-react";
import userProfileService from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";
import Link from "next/link";

interface UserStats {
    total_votes: number;
    weekly_participations: number;
    top_genre: string | null;
}


const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) => (
    <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">{value}</p>
            </div>
        </div>
    </div>
);

// ✅ Move SeptemberReward outside ProfilePage
function SeptemberReward({ totalPoints }: { totalPoints: number }) {
    const goal = 180;
    const isComplete = totalPoints >= goal;

    return (
        <div
            className={`rounded-lg p-4 transition-all ${isComplete
                ? "bg-green-800 border border-green-600"
                : "bg-gray-800"
                }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-center font-bold transition-all ${isComplete
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-700 text-gray-300"
                        }`}
                >
                    <Trophy className="w-8 h-8" />
                </div>

                <div>
                    <h3 className="font-semibold text-white">September Zine Package</h3>
                    {!isComplete ? (
                        <p className="text-sm text-gray-400">
                            Earn {goal} points this month to win all 9 zines!
                        </p>
                    ) : (
                        <p className="text-sm text-green-300 font-semibold">
                            🎉 Completed! Package on the way.
                        </p>
                    )}

                    {!isComplete && (
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-yellow-500 h-2 transition-all"
                                style={{ width: `${Math.min((totalPoints / goal) * 100, 100)}%` }}
                            />
                        </div>
                    )}

                    <p
                        className={`mt-1 text-xs ${isComplete
                            ? "text-green-400 font-bold"
                            : "text-gray-400"
                            }`}
                    >
                        {totalPoints} / {goal} points
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, refreshUserProfile } = useAuth();
    const [userHistory, setUserHistory] = useState<UserEngagementHistory | null > (null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null > (null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) {
            loadUserProfile(user.id);
        } else {
            // Handle case where user is not authenticated, though AuthGuard should prevent this.
            setLoading(false);
            setError("User not found. Please log in.");
        }
    }, [user]);

    const loadUserProfile = async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            const history = await userProfileService.getUserEngagementHistory(userId);
            setUserHistory(history);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
            console.error("Error loading profile:", errorMessage, err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshProfile = async () => {
        try {
            setRefreshing(true);
            // Also reload the user engagement history to get fresh data
            if (user) {
                await loadUserProfile(user.id);
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getWeekDisplayName = (weekIdentifier: string) => {
        if (weekIdentifier.includes('W')) {
            const [year, week] = weekIdentifier.split('-W');
            return `Week ${week}, ${year}`;
        }
        return weekIdentifier;
    };

    const calculateLevel = (points: number) => {
        return Math.floor(points / 100) + 1;
    };

    const calculateProgressToNextLevel = (points: number) => {
        const currentLevelPoints = (calculateLevel(points) - 1) * 100;
        const nextLevelPoints = calculateLevel(points) * 100;
        const progress = points - currentLevelPoints;
        const total = nextLevelPoints - currentLevelPoints;
        return { progress, total, percentage: (progress / total) * 100 };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Loading Profile...</h1>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    if (error || !userHistory) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
                    <p className="text-xl text-red-500">{error || "Profile not found"}</p>
                    <Button onClick={() => window.location.href = "/"} className="mt-4 bg-blue-600 hover:bg-blue-700">
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    const { user_profile, weekly_summaries, total_points } = userHistory;
    const level = calculateLevel(total_points);
    const levelProgress = calculateProgressToNextLevel(total_points);

    const userStats: UserStats = {
        total_votes: weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0),
        weekly_participations: weekly_summaries.length,
        top_genre: "Electronic", // Mock data since top_genre doesn't exist in the API
    };

    function WeeklyRatingsCard() {
        return (
            <Link href="/weekly-ratings" className="block">
                <div className="bg-gray-800 rounded-lg p-4 cursor-pointer 
                      transition-transform transform hover:scale-105 hover:bg-gray-700 hover:shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center 
                          transition-colors hover:bg-green-500">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                                Weekly OTW Artist Ratings
                            </h3>
                            <p className="text-sm text-gray-400">New Prizes Every Month!</p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    function Top100Card() {
        return (
            <Link href="/top100" className="block">
                <div className="bg-gray-800 rounded-lg p-4 cursor-pointer 
                      transition-transform transform hover:scale-105 hover:bg-gray-700 hover:shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center 
                          transition-colors hover:bg-green-500">
                            <BarChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                                OTW Ten Year Top 100
                            </h3>
                            <p className="text-sm text-gray-400">Vote on your favorite Top 25 from OTW's Staff Top 100 artists discovered over the last 10 years!</p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    function DiscoveryChartsCard() {
        return (
            <Link href="/discovery-charts" className="block">
                <div className="bg-gray-800 rounded-lg p-4 cursor-pointer 
                      transition-transform transform hover:scale-105 hover:bg-gray-700 hover:shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center 
                          transition-colors hover:bg-green-500">
                            <BarChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">Discovery Charts
                            </h3>
                            <p className="text-sm text-gray-400">OnesToWatch is constantly creating fun and engaging lists and charts to help you discover new artists and earn rewards!</p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

   

    return (
        <AuthGuard>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-blue-500">
                                <h2 className="text-2xl font-bold text-white">{userHistory ? userHistory.user_profile.username : user?.username}</h2>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="p-4 max-w-2xl mx-auto space-y-6">
                    {/* Profile Header Card */}
                    <Card className="bg-gray-900 border-gray-700">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                               
                            </div>

                            <div className="mt-4">
                                <SeptemberReward totalPoints={total_points} />
                              
                            </div>






                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-500">
                                        {weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0)}
                                    </div>
                                    <div className="text-xs text-gray-400">Total Votes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-purple-500">
                                        {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0)}
                                    </div>
                                    <div className="text-xs text-gray-400">Videos Watched</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-orange-500">
                                        {weekly_summaries.length}
                                    </div>
                                    <div className="text-xs text-gray-400">Weeks Active</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for detailed information */}
                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-blue-600">
                                Discovery Activities
                            </TabsTrigger>
                            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-blue-600">
                                Rewards
                            </TabsTrigger>
                        </TabsList>

                        {/* Weekly Activity Tab */}
                        <TabsContent value="activity" className="space-y-4">
                            <Card className="bg-gray-900 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Calendar className="w-5 h-5" />
                                        Current Activities
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                     <div className="space-y-4"><WeeklyRatingsCard  />
                                    </div>
                                </CardContent>
                                <CardContent className="space-y-3">
                                    <div className="space-y-4"><Top100Card />
                                    </div>
                                </CardContent>
                                <CardContent className="space-y-3">
                                    <div
                                        className="space-y-4"><DiscoveryChartsCard />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        {/* Achievements Tab */}
                        <TabsContent value="achievements" className="space-y-4"> <Card className="bg-gray-900 border-gray-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Award className="w-5 h-5" /> Rewards & Leaderboard
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                            <div className="space-y-4"><SeptemberReward totalPoints={total_points} />
                            </div>

                                {/* Voting Streak */}
                                {weekly_summaries.length >= 3 && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                                                <Star className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Consistent Voter</h3>
                                                <p className="text-sm text-gray-400">
                                                    Active for {weekly_summaries.length} weeks
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Video Watcher */}
                                {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0) >= 10 && (
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                                                <Eye className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Music Explorer</h3>
                                                <p className="text-sm text-gray-400">
                                                    Watched {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0)} artist videos
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Coming Soon */}
                                <div className="bg-gray-800 rounded-lg p-4 opacity-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                                            <Award className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-400">More achievements coming soon...</h3>
                                            <p className="text-sm text-gray-500">
                                                Keep voting and exploring to unlock new badges!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        </TabsContent>
                    </Tabs>

                    {/* OTW STAFF ONLY Section - Only visible to otwstaff users */}
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <BarChart className="w-4 h-4" />
                                        Submit Content
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = "/discovery-charts"}
                                        className="w-full bg-transparent text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp className="w-4 h-4" />
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