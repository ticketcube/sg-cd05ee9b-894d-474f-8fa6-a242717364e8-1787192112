import { useState, useEffect } from "react";
import { Trophy, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
    const fetchUserPoints = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_engagements")
          .select("points_earned")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user points:", error);
          setTotalPoints(0);
        } else {
          const total = data?.reduce((sum, engagement) => sum + (engagement.points_earned || 0), 0) || 0;
          setTotalPoints(total);
        }
      } catch (err) {
        console.error("Unexpected error fetching points:", err);
        setTotalPoints(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPoints();
  }, [user]);

  if (loading) {
    return (
      <Card className="relative overflow-hidden shadow-xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60" style={{ borderColor: 'hsl(279, 92%, 25%)' }}>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-purple-200/50 rounded-full"></div>
            <div className="h-6 bg-purple-200/50 rounded-lg w-3/4"></div>
            <div className="h-4 bg-purple-200/50 rounded w-full"></div>
            <div className="h-2 bg-purple-200/50 rounded-full w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden shadow-xl bg-gradient-to-br from-purple-50/80 via-white to-purple-50/60 hover:shadow-2xl transition-all duration-700 hover:-translate-y-1 group" style={{ borderColor: 'hsl(279, 92%, 25%)', borderWidth: '2px' }}>
      {/* Decorative background elements */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-200/30 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-200/40 rounded-full blur-xl"></div>
      
      <CardContent className="relative p-4 space-y-6">
        {/* Trophy Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: 'hsl(279, 92%, 25%)', boxShadow: '0 10px 25px -5px hsl(279, 92%, 25%, 0.3)' }}>
              <Trophy className="w-7 h-7 text-white" />
            </div>
            {progressPercentage === 100 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Gift className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-semibold leading-tight" style={{ color: 'hsl(279, 92%, 25%)' }}>
              September Discovery Reward!
            </h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Earn 240 points to receive all nine OnesToWatch Zines!
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-neutral-700">
              {totalPoints} / {TARGET_POINTS} points
            </span>
            <span className="font-semibold" style={{ color: 'hsl(279, 92%, 25%)' }}>
              {progressPercentage.toFixed(0)}% complete
            </span>
          </div>

          {/* Custom Progress Bar */}
          <div className="relative">
            <div className="w-full h-3 bg-neutral-200/60 rounded-full overflow-hidden shadow-inner" style={{ borderColor: 'hsl(279, 92%, 25%)', borderWidth: '1px' }}>
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(to right, hsl(279, 92%, 25%), hsl(279, 92%, 30%), hsl(279, 92%, 25%))`
                }}
              >
                {progressPercentage > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                )}
              </div>
            </div>
            
            {/* Milestone markers */}
            <div className="absolute top-0 left-1/4 w-0.5 h-3 bg-white/60"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-white/60"></div>
            <div className="absolute top-0 left-3/4 w-0.5 h-3 bg-white/60"></div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {progressPercentage === 100 ? (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
                <p className="text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                  <Gift className="w-4 h-4" />
                  Congratulations! You've earned all nine zines!
                </p>
              </div>
            ) : progressPercentage >= 75 ? (
              <p className="font-medium text-sm" style={{ color: 'hsl(279, 92%, 25%)' }}>
                Almost there! Just {TARGET_POINTS - totalPoints} more points to go!
              </p>
            ) : progressPercentage >= 50 ? (
              <p className="font-medium text-sm" style={{ color: 'hsl(279, 92%, 25%)' }}>
                Great progress! You're halfway to your reward!
              </p>
            ) : progressPercentage >= 25 ? (
              <p className="font-medium text-sm" style={{ color: 'hsl(279, 92%, 25%)' }}>
                Keep going! You're making solid progress!
              </p>
            ) : (
              <p className="text-neutral-600 font-medium text-sm">
                Start exploring to earn your first points!
              </p>
            )}
          </div>
        </div>

        {/* Floating accent */}
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full group-hover:animate-bounce" style={{ backgroundColor: 'hsl(279, 92%, 25%, 0.5)' }}></div>
      </CardContent>
    </Card>
  );
}