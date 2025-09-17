

import type { UserProfile } from "@/services/userProfileService";
import { useState, useEffect } from "react";
import { Sparkles, Trophy, Star, Calendar, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";

interface CombinedDashboardTopProps {
    profile: UserProfile | null;
    historyLoading: boolean;
    total_points: number;
    artistsDiscovered: number;
    weeksActive: number;
}

export default function CombinedDashboardTop({
    profile,
    historyLoading,
    total_points,
    artistsDiscovered,
    weeksActive
}: CombinedDashboardTopProps) {
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
                    const total = data?.reduce((sum, e) => sum + (e.points_earned || 0), 0) || 0;
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
            <div className="max-w-6xl mx-auto px-2 py-3">
                {/* Combined Header - Flexible height based on content */}
                <div className="flex flex-col space-y-3">
                    
                    {/* Top Section: Title + Welcome */}
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 mb-1">
                            <Sparkles className="w-6 h-6 text-purple-deep" />
                            <span className="text-lg font-bold text-purple-deep">Discovery Dashboard</span>
                        </div>
                        <h1 className="text-lg font-bold text-black">
                            Welcome back, {profile?.username || 'Explorer'}
                        </h1>
                    </div>

                    {/* Stats Row - Compact */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Trophy className="w-4 h-4 text-purple-deep mx-auto mb-1" />
                            <div className="text-sm font-bold text-purple-med">{historyLoading ? '...' : total_points}</div>
                            <div className="text-xs text-purple-deep">Points</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Star className="w-4 h-4 text-purple-deep mx-auto mb-1" />
                            <div className="text-sm font-bold text-purple-med">{historyLoading ? '...' : artistsDiscovered}</div>
                            <div className="text-xs text-purple-deep">Artists</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-purple-deep">
                            <Calendar className="w-4 h-4 text-purple-deep mx-auto mb-1" />
                            <div className="text-sm font-bold text-purple-med">{historyLoading ? '...' : weeksActive}</div>
                            <div className="text-xs text-purple-deep">Weeks</div>
                        </div>
                    </div>

                    {/* September Reward Tracker - Auto-sized based on content */}
                    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60 border-2 border-purple-700">
                        <div className="p-3">
                            
                            {/* Header Row */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-med text-white shrink-0">
                                    <Trophy className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-purple-med leading-tight">September Rewards</h3>
                                    <p className="text-xs text-neutral-600 leading-tight">Earn 240 points for all zines</p>
                                </div>
                                {progressPercentage === 100 && (
                                    <Gift className="w-5 h-5 text-emerald-500 shrink-0 animate-pulse" />
                                )}
                            </div>

                            {/* Progress Section */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>{loading ? '...' : totalPoints} / {TARGET_POINTS} points</span>
                                    <span className="font-semibold text-purple-med">{loading ? '...' : progressPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-purple-med via-purple-deep to-purple-700 transition-all duration-1000"
                                        style={{ width: loading ? '0%' : `${progressPercentage}%` }}
                                    />
                                </div>
                                <div className="text-center text-xs font-medium pt-1">
                                    {loading ? 'Loading...' :
                                        progressPercentage === 100
                                            ? <span className="text-emerald-700">🎉 All zines earned!</span>
                                            : progressPercentage >= 75
                                                ? <span className="text-purple-700">Almost there! {TARGET_POINTS - totalPoints} more!</span>
                                                : progressPercentage >= 50
                                                    ? <span className="text-purple-700">Halfway there!</span>
                                                    : progressPercentage >= 25
                                                        ? <span className="text-purple-700">Good progress!</span>
                                                        : <span className="text-neutral-600">Start exploring!</span>
                                    }
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

