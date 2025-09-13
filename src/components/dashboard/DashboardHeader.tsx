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
   <div className="bg-white">
  <div className="max-w-6xl mx-auto px-2 py-4">

    {/* Discovery Dashboard Title - Now purple text, no background */}
    <div className="inline-flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
      <Sparkles className="w-8 h-8 text-purple-deep" />
      <span className="text-3xl font-bold text-[hsl(279,92%,25%)]">
        Discovery Dashboard
      </span>
    </div>

                <div className="text-center mb-2">
                    <h1 className="text-2xl md:text-2xl font-bold text-black mb-3">
                        Welcome back, {profile?.username || 'Explorer'}
                    </h1>
                
                 
                    
                    <p className="text-lg text-gray-600 mb-8">
                        Your gateway to discovering amazing new artists and earning rewards
                    </p>

                    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
                        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                            <Trophy className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-black">{historyLoading ? '...' : total_points}</div>
                            <div className="text-sm text-gray-500">Points</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                            <Star className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-black">{historyLoading ? '...' : artistsRated}</div>
                            <div className="text-sm text-gray-500">Artists</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                            <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-black">{historyLoading ? '...' : weeksActive}</div>
                            <div className="text-sm text-gray-500">Weeks</div>
                        </div>
                    </div>

                    <WeeklyListCard />
                </div>
            </div>
        </div>
    );
}