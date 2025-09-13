import { useState, useEffect } from "react";
import { Trophy, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";

export function SeptemberReward() {
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

    if (loading) return <Card className="p-6 animate-pulse">Loading...</Card>;

    return (
        <Card className="relative p-4 overflow-hidden shadow-xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60 border-2 border-purple-700">

            {/* Row 1: Icon + Title */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-lit text-white">
                    <Trophy className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-purple-lit">September Reward Tracker</h3>
                    <p className="text-sm text-neutral-600">Earn 240 points to unlock all nine OnesToWatch Zines</p>
                </div>
                {progressPercentage === 100 && (
                    <Gift className="w-6 h-6 text-emerald-500 ml-auto animate-pulse" />
                )}
            </div>

            {/* Row 2: Progress Bar + Numbers */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span>{totalPoints} / {TARGET_POINTS} points</span>
                    <span className="font-semibold text-purple-lit">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-lit via-purple-deep to-purple-700 transition-all duration-1000"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Row 3: Status message */}
            <div className="text-center text-sm font-medium">
                {progressPercentage === 100
                    ? <span className="text-emerald-700">🎉 Congratulations! You earned all zines!</span>
                    : progressPercentage >= 75
                        ? <span className="text-purple-700">Almost there! Only {TARGET_POINTS - totalPoints} more points!</span>
                        : progressPercentage >= 50
                            ? <span className="text-purple-700">Halfway there! Keep going!</span>
                            : progressPercentage >= 25
                                ? <span className="text-purple-700">Good progress! Keep exploring!</span>
                                : <span className="text-neutral-600">Start exploring to earn your first points!</span>
                }
            </div>

        </Card>
    );
}
