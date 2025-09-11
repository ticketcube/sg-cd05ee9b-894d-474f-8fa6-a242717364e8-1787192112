import type { UserProfile } from "@/contexts/UserProfileContext";
import { Sparkles, Trophy, Star, Calendar } from "lucide-react";
import HeroVideo from "./HeroVideo";

interface DashboardHeaderProps {
    profile: UserProfile | null;
    historyLoading: boolean;
    total_points: number;
    totalVotes: number;
    weeksActive: number;
}

export default function DashboardHeader({
    profile,
    historyLoading,
    total_points,
    totalVotes,
    weeksActive
}: DashboardHeaderProps) {
    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
            <div className="relative max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-12">
                <div className="text-center mb-6 md:mb-12">
                    <div className="inline-flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-sm rounded-full px-3 md:px-6 py-2 md:py-3 mb-4 md:mb-6 border border-white/10">
                        <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-white" />
                        <span className="text-white font-medium text-sm md:text-base">Discovery Dashboard</span>
                    </div>

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2">
                        Welcome back, {profile?.username || 'Explorer'}!
                    </h1>
                    <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 px-4">
                        Your gateway to discovering amazing new artists and earning rewards
                    </p>

                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                            <Trophy className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{historyLoading ? '...' : total_points}</div>
                            <div className="text-xs text-gray-400">Points</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                            <Star className="w-5 h-5 text-green-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{historyLoading ? '...' : totalVotes}</div>
                            <div className="text-xs text-gray-400">Artists Rated</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                            <Calendar className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{historyLoading ? '...' : weeksActive}</div>
                            <div className="text-xs text-gray-400">Weeks</div>
                        </div>
                    </div>
                    <WeeklyListCard />

                </div>
            </div>
        </div>
    );
}