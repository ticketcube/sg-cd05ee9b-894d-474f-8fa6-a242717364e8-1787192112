
import Link from "next/link";
import { Settings, Map, Upload, BarChart } from "lucide-react";

export default function StaffPortalTab() {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25">
                    <Settings className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">OTW Staff Portal</h2>
                <p className="text-gray-400">Internal tools and administrative access</p>
            </div>

            <div className="grid gap-6">
                {/* Product Roadmap */}
                <Link href="/product-roadmap" className="block group">
                    <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm shadow-lg shadow-blue-900/20">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center group-hover:from-blue-400 group-hover:to-indigo-400 transition-all shadow-lg shadow-blue-500/25 group-hover:scale-110">
                                <Map className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-xl group-hover:text-blue-300 transition-colors mb-2">
                                    Product Roadmap
                                </h3>
                                <p className="text-gray-300 mb-4 group-hover:text-blue-100 transition-colors">
                                    View and manage the product development roadmap, feature requests, and project status
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                    <span className="text-sm text-blue-300 font-medium">Feature Planning • Status Updates • Feedback</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-1">
                                <BarChart className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Brandfolder Content Upload */}
                <Link href="/brandfolder-upload" className="block group">
                    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-[1.02] cursor-pointer backdrop-blur-sm shadow-lg shadow-purple-900/20">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-pink-400 transition-all shadow-lg shadow-purple-500/25 group-hover:scale-110">
                                <Upload className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors mb-2">
                                    Submit Content
                                </h3>
                                <p className="text-gray-300 mb-4 group-hover:text-purple-100 transition-colors">
                                    Upload and manage content submissions to Brandfolder for brand assets and materials
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                                    <span className="text-sm text-purple-300 font-medium">Asset Management • Brand Content • Media Upload</span>
                                    <div className="ml-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs px-2 py-1 rounded-full">
                                        In Development
                                    </div>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:translate-x-1">
                                <Upload className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Additional Staff Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20">
                <div className="text-center">
                    <h4 className="font-semibold text-white text-lg mb-2">Staff Access Level</h4>
                    <p className="text-gray-400 text-sm mb-4">
                        You have administrative access to internal tools and development features.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs px-3 py-2 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="font-medium">OTW Staff Member</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
