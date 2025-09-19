import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Gift } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import Link from "next/link";

export default function SeptemberReward() {
    const { user } = useUserProfile();
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    const TARGET_POINTS = 160;
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
        <Card className="overflow-hidden border-2 border-purple-700 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60">
            <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start gap-3 mb-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-med text-white shrink-0">
                        <Trophy className="w-6 h-6" />
                    </div>

                    {/* Title + Description */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-purple-med leading-tight">
                            September Reward
                        </h3>
                        <p className="text-sm text-neutral-600 mt-1">
                            Earn 160 points by September 28th to receive all 8 zines!
                        </p>
                    </div>
                </div>
                  
                </div>
                {/* Progress Tracker */}
                <div className="space-y-2">
                    <div className="flex justify-between text-s">
                        <span>{loading ? "..." : totalPoints} / {TARGET_POINTS} points</span>
                        <span className="font-semibold text-purple-med">
                            {loading ? "..." : progressPercentage.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-med via-purple-deep to-purple-700 transition-all duration-1000"
                            style={{ width: loading ? "0%" : `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="text-center text-s font-medium pt-1">
                        {loading ? "Loading..." :
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
                <p className="text-sm text-purple-deep  text-center py-10">
                    The September Discovery Reward is <strong>all eight OnesToWatch Zines</strong>.
                    These limited edition collector issues feature our favorite rising stars
                    on their way to greatness!
                </p>


                {/* Image */}
                <Link href="/september/rewards">
                    <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-lg">
                        <Image
                            src="https://cdn.brandfolder.io/364H2QNG/at/rq4k9zrphcjp43xcbhng5m58/Zines_Photo.png"
                            alt="OnesToWatch Zine Collection"
                            fill
                            className="object-cover"
                            sizes="100vw"
                        />
                    </div>
                </Link>

               
            </div>
        </Card>
    );
}
