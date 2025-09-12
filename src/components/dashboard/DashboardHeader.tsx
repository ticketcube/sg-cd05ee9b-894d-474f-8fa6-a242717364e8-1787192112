import type { UserProfile } from "@/services/userProfileService";
import { Sparkles, Trophy, Star, Calendar } from "lucide-react";
import HeroVideo from "./HeroVideo";
import WeeklyListCard from './WeeklyListCard';

interface DashboardHeaderProps {
    profile: UserProfile | null;
    historyLoading: boolean;
    total_points: number;
    total_engagements: number;
    weeksActive: number;
}

export default function DashboardHeader({
    profile,
    historyLoading,
    total_points,
    total_engagements,
    weeksActive
}: DashboardHeaderProps) {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
            <div className="relative max-w-4xl mx-auto px-3 md:px-2 py-2 md:py-12">
                <div className="text-center mb-6 md:mb-12">
                    <div className="inline-flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-sm rounded-full px-3 md:px-2 py-2 md:py-3 mb-4 md:mb-6 border border-white/10">
                        <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-white" />
                        <span className="text-white font-large text-sm md:text-base">Discovery Dashboard</span>
                    </div>

                    
                    <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 px-2">
                        Your gateway to discovering amazing new artists and earning rewards
                    </p>

                  <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
  <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/10">
    <Trophy className="w-4 h-4 text-blue-400 mx-auto mb-1" />
    <div className="text-sm font-bold text-white">{historyLoading ? '...' : total_points}</div>
    <div className="text-[14px] text-gray-400">Reward Points</div>
  </div>
  <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/10">
    <Star className="w-4 h-4 text-green-400 mx-auto mb-1" />
                            <div className="text-sm font-bold text-white">{historyLoading ? '...' : total_engagements}</div>
    <div className="text-[14px] text-gray-400">Artists Discovered</div>
  </div>
  <div className="bg-white/5 rounded-lg px-2 py-1 text-center border border-white/10">
    <Calendar className="w-4 h-4 text-orange-400 mx-auto mb-1" />
    <div className="text-sm font-bold text-white">{historyLoading ? '...' : weeksActive}</div>
    <div className="text-[14px] text-gray-400">Weeks</div>
  </div>
</div>

                    <WeeklyListCard />

                </div>
            </div>
        </div>
    );
}