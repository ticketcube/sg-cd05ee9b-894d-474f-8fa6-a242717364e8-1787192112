import type { UserProfile } from "@/services/userProfileService";
import { Sparkles, Trophy, Star, Calendar } from "lucide-react";
import WeeklyListCard from './WeeklyListCard';

interface DashboardHeaderProps {
    profile: UserProfile | null;
    historyLoading: boolean;
    total_points: number;
    artistsRated: number;
    weeksActive: number;
}

export default function DashboardHeader({
    profile,
    historyLoading,
    total_points,
    artistsRated,
    weeksActive
}: DashboardHeaderProps) {
    return (
        <div className="relative overflow-hidden bg-black">
            <div className="relative max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-white font-medium">Discovery Dashboard</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        Welcome back, {profile?.username || 'Explorer'}
                    </h1>
                    
                    <p className="text-lg text-gray-300 mb-8">
                        Your gateway to discovering amazing new artists and earning rewards
                    </p>

                    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                            <Trophy className="w-5 h-5 text-white mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{historyLoading ? '...' : total_points}</div>
                            <div className="text-xs text-gray-400">Points</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                            <Star className="w-5 h-5 text-white mx-auto mb-2" />
                            <div className="text-lg font-bold text-white">{historyLoading ? '...' : artistsRated}</div>
                            <div className="text-xs text-gray-400">Artists</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                            <Calendar className="w-5 h-5 text-white mx-auto mb-2" />
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