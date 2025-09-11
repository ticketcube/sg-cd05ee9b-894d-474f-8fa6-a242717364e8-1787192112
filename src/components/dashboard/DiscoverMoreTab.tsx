import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Star, Music, BarChart } from 'lucide-react';

export default function DiscoverMoreTab() {
    return (
        <div className="space-y-6 md:space-y-8">
            {/* Weekly List Card - Hero Section */}
            
            {/* Discovery Options */}
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">More Ways to Discover</h2>
                <p className="text-gray-400 text-sm md:text-base px-4">Explore different ways to find your next favorite artist</p>
            </div>
            
            <div className="grid gap-4 md:gap-6">
                <Link href="/weekly-ratings" className="block group">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:from-green-400 group-hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25 flex-shrink-0">
                                <Star className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-green-300 transition-colors mb-1 md:mb-2">Weekly Artist Ratings</h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Watch & Rate emerging artists and earn points for each discovery</p>
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                    <Badge className="bg-green-600 text-white px-2 md:px-3 py-1 text-xs md:text-sm">10 per rating</Badge>
                                    <Badge variant="outline" className="border-green-500 text-green-400 px-2 md:px-3 py-1 text-xs md:text-sm">5 per video</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
                
               
                
              
            </div>
        </div>
    );
}