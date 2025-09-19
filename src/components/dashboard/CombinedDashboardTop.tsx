

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
                            {profile?.username || 'Explorer'} 's' Rewards Dashboard
                        </h1>
                        <p className="mt-4 text-sm text-muted-foreground pb-2">
               Earn points for discovering new artists.  We'll reward you with prizes, exclusive merch and insider access!
                        </p>

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

                   
                </div>
            </div>
        </div>
    );
}

