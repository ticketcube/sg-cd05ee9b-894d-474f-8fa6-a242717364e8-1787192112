import type { UserProfile } from "@/services/userProfileService";
import { useState, useEffect } from "react";
import { Sparkles, Trophy, Star, Calendar, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

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
                <div className="flex flex-col space-y-3 pt-4">
                    
                    {/* Top Section: Title + Welcome */}
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
                            {profile?.username || 'Explorer'}'s Rewards Dashboard
                        </h1>
                    </div>

                    {/* Stats Row - Compact with responsive padding for large screens */}
                    <div className="lg:px-16 xl:px-24">
                        <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
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
                    </div>

                    {/* Description Text - Now below the data boxes */}
                    <div className="text-center pt-0">
                     
                        
                        {/* Purple Button linking to september-rewards */}
                        <Link href="/september/rewards">
                            <Button className="bg-[hsl(279,92%,25%)] hover:bg-[hsl(279,92%,20%)] text-white">
                                Discover More Artists!
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

