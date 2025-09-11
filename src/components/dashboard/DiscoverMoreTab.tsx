import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Star, Music, BarChart } from 'lucide-react';

export default function DiscoverMoreTab() {
    return (
        <div className="space-y-6 md:space-y-8">
            {/* Weekly List Card - Hero Section */}
            
            {/* Discovery Options */}
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Discovery Activities </h2>
            
            </div>
            
            <div className="grid gap-4 md:gap-6">
                <Link href="/weekly-ratings" className="block group">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:from-green-400 group-hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25 flex-shrink-0">
                                <Star className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-green-300 transition-colors mb-1 md:mb-2">Weekly Featured Artists</h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Watch & Rate emerging artists and earn points for each discovery</p>
                            
                            </div>
                        </div>
                    </div>
                </Link>
                
                <Link href="/vibes" className="block group">
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/25 flex-shrink-0">
                                <Music className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-purple-300 transition-colors mb-1 md:mb-2">Global Vibes Chart</h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Explore artists by mood and discover new sounds that match your vibe</p>
                                <Badge variant="outline" className="border-purple-500 text-purple-400 px-2 md:px-3 py-1 text-xs md:text-sm">Coming Soon!</Badge>
                            </div>
                        </div>
                    </div>
                </Link>
                
                <Link href="/discovery-charts" className="block group">
                    <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center group-hover:from-orange-400 group-hover:to-red-400 transition-all shadow-lg shadow-orange-500/25 flex-shrink-0">
                                <BarChart className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-orange-300 transition-colors mb-1 md:mb-2">OTW Ten Year 750</h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Watch and Vote on all 750 artists OTW has covered over our 10 year history/p>
                                <Badge variant="outline" className="border-orange-500 text-orange-400 px-2 md:px-3 py-1 text-xs md:text-sm">5 points per vote</Badge>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}