import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function MonthlyReward() {
    const { user } = useUserProfile();
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reward, setReward] = useState < {
        id: number;
        action_name: string;
        points_value: number;
        description: string;
        reward_description: string;
        rewards_url: string;
    } | null > (null);

    // Fetch active reward
    useEffect(() => {
        const fetchReward = async () => {
            const { data, error } = await supabase
                .from("points_config")
                .select("id, action_name, points_value, description, reward_description, rewards_url")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error("Error fetching reward config:", error);
                setReward(null);
            } else {
                setReward(data);
            }
        };

        fetchReward();
    }, []);

    // Fetch user total points
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
                    const total = data?.reduce(
                        (sum, e) => sum + (e.points_earned || 0),
                        0
                    ) || 0;
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

    const targetPoints = reward?.points_value || 0;
    const progressPercentage =
        targetPoints > 0
            ? Math.min((totalPoints / targetPoints) * 100, 100)
            : 0;

    return (
        <Card className="overflow-hidden border-2 border-purple-700 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60">
            <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-deep text-white shrink-0">
                        <Trophy className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-purple-deep leading-tight">
                            {reward?.action_name || "Monthly Reward"}
                        </h3>
                        <p className="text-xs text-neutral-600 mt-1">
                            {reward?.description ||
                                "Complete this month's challenge to earn exclusive rewards!"}
                        </p>
                    </div>
                </div>

                {/* Progress Tracker */}
                {reward && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-s">
                            <span>
                                {loading ? "..." : totalPoints} / {targetPoints} points
                            </span>
                            <span className="font-semibold text-purple-med">
                                {loading ? "..." : progressPercentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-lit via-purple-deep to-purple-700 transition-all duration-1000"
                                style={{ width: loading ? "0%" : `${progressPercentage}%` }}
                            />
                        </div>
                        <div className="text-center text-s font-medium pt-1">
                            {loading ? (
                                "Loading..."
                            ) : progressPercentage === 100 ? (
                                <span className="text-emerald-700">🎉 Reward achieved!</span>
                            ) : progressPercentage >= 75 ? (
                                <span className="text-purple-700">
                                    Almost there! {targetPoints - totalPoints} more!
                                </span>
                            ) : progressPercentage >= 50 ? (
                                <span className="text-purple-700">Halfway there!</span>
                            ) : progressPercentage >= 25 ? (
                                <span className="text-purple-700">Good progress!</span>
                            ) : (
                                <span className="text-neutral-600">Start exploring!</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Reward Details / Image */}
                <p className="text-xs text-purple-deep text-center py-5">
                    {reward?.reward_description || "This Month's Reward!"}
                </p>

                {reward?.rewards_url && (
                    <Link href={"/september/rewards"}>
                        <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
                            <Image
                                src={reward.rewards_url}
                                alt={reward.action_name || "Reward Image"}
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                    </Link>
                )}
            </div>
        </Card>
    );
}
