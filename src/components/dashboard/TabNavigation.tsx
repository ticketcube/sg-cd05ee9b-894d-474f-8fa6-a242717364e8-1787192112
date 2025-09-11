
import { Compass, Gift, Settings } from "lucide-react";

interface TabNavigationProps {
    activeTab: string;
    setActiveTab: (tab: "discover" | "rewards" | "staff") => void;
    role: string | null;
}

export default function TabNavigation({ activeTab, setActiveTab, role }: TabNavigationProps) {
    return (
        <div className="flex justify-center mb-6 md:mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-1.5 md:p-2 border border-white/10 w-full max-w-lg">
                <div className="flex gap-1 md:gap-2">
                    <button
                        onClick={() => setActiveTab("discover")}
                        className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${activeTab === "discover" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                    >
                        <Compass className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Discover More</span>
                        <span className="sm:hidden">Discover</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("rewards")}
                        className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${activeTab === "rewards" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                    >
                        <Gift className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                        <span className="hidden sm:inline">More Rewards</span>
                        <span className="sm:hidden">Rewards</span>
                    </button>
                    {role === 'otwstaff' && (
                        <button
                            onClick={() => setActiveTab("staff")}
                            className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${activeTab === "staff" ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <Settings className="w-3 md:w-4 h-3 md:h-4 inline mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Staff Portal</span>
                            <span className="sm:hidden">Staff</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
