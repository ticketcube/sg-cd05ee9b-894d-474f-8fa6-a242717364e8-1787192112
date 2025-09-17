import type { UserProfile } from "@/services/userProfileService";
import { Sparkles, Trophy, Star, Calendar, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import WeeklyListCard from "./WeeklyListCard";

interface DiscoveryDashboardProps {
    profile: UserProfile | null;
    historyLoading: boolean;
    total_points: number;
    artistsDiscovered: number;
    weeksActive: number;
}

export default function DiscoveryDashboard({
    profile,
    historyLoading,
    total_points,
    artistsDiscovered,
    weeksActive,
}: DiscoveryDashboardProps) {
    const { user } = useUserProfile();
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    const TARGET_POINTS = 240;
    const progressPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

    useEffect(() => {
        const fetchPoints = async () => {
            if (!user) return setLoading(false);

            try {
                const { data, error } = await supabase
                    .from("user_engagements")
                    .select("points_earned")
                    .eq("user_id", user.id);

                if (error) {
                    console.error(error);
                    setTotalPoints(0);
                } else {
                    const total =
                        data?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;
                    setTotalPoints(total);
                }
            } catch (err) {
                console.error(err);
                setTotalPoints(0);
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, [user]);

    return (
        <div className="bg-white">
            <div className="max-w-6xl mx-auto px-2 py-6 space-y-10">
                {/* Dashboard Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 md:gap-3 mb-6">
                        <Sparkles className="w-8 h-8 text-[hsl(279,92%,25%)]" />
                        <span className="text-2xl font-bold text-purple-deep">
                            Discovery Dashboard
                        </span>
                    </div>

                    <h1 className="text-xl md:text-2xl font-bold text-black mb-3">
                        Welcome back, {profile?.username || "Explorer"}
                    </h1>
                    <p className="text-sm text-gray-600 mb-8">
                        This dashboard is your gateway to discovering amazing new artists
                        and earning rewards!
                    </p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-12">
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Trophy className="w-5 h-5 text-purple-deep mx-auto mb-2" />
                            <div className="text-xl font-bold text-purple-med">
                                {historyLoading ? "..." : total_points}
                            </div>
                            <div className="text-sm text-purple-deep">Points</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Star className="w-5 h-5 text-purple-deep mx-auto mb-2" />
                            <div className="text-xl font-bold text-purple-med">
                                {historyLoading ? "..." : artistsDiscovered}
                            </div>
                            <div className="text-sm text-purple-deep">Artists</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Calendar className="w-5 h-5 text-purple-deep mx-auto mb-2" />
                            <div className="text-xl font-bold text-purple-med">
                                {historyLoading ? "..." : weeksActive}
                            </div>
                            <div className="text-sm text-purple-deep">Weeks</div>
                        </div>
                    </div>
                </div>

                {/* Reward Tracker */}
                <Card className="relative p-4 overflow-hidden shadow-xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60 border-2 border-purple-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-med text-white">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-purple-med">
                                September Reward Tracker
                            </h3>
                            <p className="text-sm text-neutral-600">
                                Earn 240 points to unlock all nine OnesToWatch Zines
                            </p>
                        </div>
                        {progressPercentage === 100 && (
                            <Gift className="w-6 h-6 text-emerald-500 ml-auto animate-pulse" />
                        )}
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>
                                {loading ? "..." : totalPoints} / {TARGET_POINTS} points
                            </span>
                            <span className="font-semibold text-purple-med">
                                {progressPercentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-med via-purple-deep to-purple-700 transition-all duration-1000"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="text-center text-sm font-medium">
                        {progressPercentage === 100 ? (
                            <span className="text-emerald-700">
                                🎉 Congratulations! You earned all zines!
                            </span>
                        ) : progressPercentage >= 75 ? (
                            <span className="text-purple-700">
                                Almost there! Only {TARGET_POINTS - totalPoints} more points!
                            </span>
                        ) : progressPercentage >= 50 ? (
                            <span className="text-purple-700">Halfway there! Keep going!</span>
                        ) : progressPercentage >= 25 ? (
                            <span className="text-purple-700">
                                Good progress! Keep exploring!
                            </span>
                        ) : (
                            <span className="text-neutral-600">
                                Start exploring to earn your first points!
                            </span>
                        )}
                    </div>
                </Card>

                {/* Weekly List */}
                <WeeklyListCard />
            </div>
        </div>
    );
}
