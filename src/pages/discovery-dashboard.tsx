import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Component Imports
import CombinedDashboardTop from '@/components/dashboard/CombinedDashboardTop';
import ModuleCard from '@/components/dashboard/RewardsCard';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { Button } from '@/components/ui/button';
import { AlertCircle, Star, ArrowRight } from 'lucide-react';

// Hook & Service Imports
import { useUserProfile } from '@/contexts/UserProfileContext';

const DiscoveryDashboard = () => {
    const { 
        profile, 
        loading: userLoading, 
        user, 
        isAuthenticated, 
        sessionLoading,
        engagementHistory,
        historyLoading,
        historyError,
        retryHistory
    } = useUserProfile();
    
    const [activeTab, setActiveTab] = useState('discover');
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const historyLoadTriggered = useRef(false);

    // ✅ LAZY ENGAGEMENT HISTORY LOADING: Only when history data is actually needed for display
    useEffect(() => {
        if (
            isAuthenticated &&
            profile &&
            user &&
            !userLoading &&
            !sessionLoading &&
            !historyLoadTriggered.current &&
            !engagementHistory &&
            !historyLoading
        ) {
            historyLoadTriggered.current = true;
            console.log('[DiscoveryDashboard] Loading engagement history on demand');
            retryHistory().catch(error => {
                console.warn('[DiscoveryDashboard] Engagement history load failed:', error);
            });
        }
    }, [isAuthenticated, profile, user, userLoading, sessionLoading, engagementHistory, historyLoading, retryHistory]);

    // Simplified loading logic - no artificial delays
    const showLoadingScreen = () => {
        // Show loading if session is still checking
        if (sessionLoading) return true;
        
        // Show loading if authenticated but profile is still loading
        if (isAuthenticated && userLoading) return true;
        
        return false;
    };

    // Show loading screen
    if (showLoadingScreen()) {
        return <DashboardLoading />;
    }

    // Show auth block if not authenticated or no profile
    if (!isAuthenticated || !profile || !user) {
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
    }

    return (
        <div className="bg-white flex flex-col">
            {historyError && (
                <div className="bg-red-50 border border-red-200 p-3 shrink-0">
                    <div className="max-w-6xl mx-auto flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-sm text-red-600">{historyError}</p>
                        <button
                            onClick={retryHistory}
                            className="ml-auto text-xs text-red-700 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Combined Header + September Reward Tracker */}
            <div className="shrink-0">
                <CombinedDashboardTop
                    profile={profile}
                    historyLoading={historyLoading}
                    total_points={engagementHistory?.total_points || 0}
                    artistsDiscovered={engagementHistory?.artistsDiscovered || 0}
                    weeksActive={engagementHistory?.weekly_summaries?.length || 0}
                />
            </div>
            <div className="flex justify-center pt-5">
                <Link href="/september/rewards">
                    <Button
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
                    >
                        <span className="flex items-center space-x-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs">Watch & Earn</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                        </span>
                    </Button>
                </Link>
            </div>

            {/* Weekly List Card - Takes remaining space without forcing full screen height */}
            <div className="px-2 pb-2">
                <div className="max-w-6xl mx-auto">
                    <ModuleCard
                        image="https://cdn.brandfolder.io/364H2QNG/at/rq4k9zrphcjp43xcbhng5m58/Zines_Photo.png"
                        title="OnesToWatch Zine Collection"
                        subtitle="Earn 240 points by September 28th and we'll send you all 8 issues!"
                        href="/september/rewards"
                    />
                    
                    {/* CTA Button */}
                   
                </div>
            </div>
            
        </div>
    );
};

export default DiscoveryDashboard;