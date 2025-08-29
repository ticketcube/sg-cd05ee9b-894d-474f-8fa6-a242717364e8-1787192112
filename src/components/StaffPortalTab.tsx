
import Link from "next/link";
import { Settings, Map, Upload, BarChart, TrendingUp,Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";


export default function StaffPortalTab() {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="text-center mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">OTW Staff Portal</h2>
                <p className="text-gray-400 text-sm md:text-base px-4">Internal tools and administrative access</p>
            </div>

            <div className="grid gap-4 md:gap-6">
                {/* Product Roadmap */}
                <Link href="/product-roadmap" className="block group">
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-500/30 hover:border-green-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center group-hover:from-green-400 group-hover:to-emerald-400 transition-all shadow-lg shadow-green-500/25 flex-shrink-0">
                                <Map className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-green-300 transition-colors mb-1 md:mb-2">
                                    Product Roadmap
                                </h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">View and manage the product development roadmap, feature requests, and project status</p>
                                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                </div>
                            </div>
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                                <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Brandfolder Content Upload */}
                <Link href="/brandfolder-upload" className="block group">
                    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-14 md:w-20 h-14 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-purple-500/25 flex-shrink-0">
                                <Upload className="w-7 md:w-10 h-7 md:h-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-purple-300 transition-colors mb-1 md:mb-2">
                                    Submit Content
                                </h3>
                                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base"> Upload and manage content submissions to Brandfolder for brand assets and materials</p>
                                <Badge variant="outline" className="border-purple-500 text-purple-400 px-2 md:px-3 py-1 text-xs md:text-sm"> In Development</Badge>
                            </div>
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                                <Zap className="w-3 md:w-4 h-3 md:h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Additional Staff Info */}
                <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-500/30 hover:border-orange-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg md:text-xl group-hover:text-orange-300 transition-colors mb-1 md:mb-2">
                                Staff Access Level
                            </h3>
                            <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">You have administrative access to internal tools and development features.</p>
                            <Badge variant="outline" className="border-orange-500 text-orange-400 px-2 md:px-3 py-1 text-xs md:text-sm">OTW Staff Member</Badge>
                        </div>
                        <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all flex-shrink-0">
                            <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
