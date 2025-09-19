import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Component Imports
import CombinedDashboardTop from '@/components/dashboard/CombinedDashboardTop';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { AlertCircle } from 'lucide-react';
import SeptemberReward from "@/components/dashboard/SeptemberReward";

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

    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const historyLoadTriggered = useRef(false);

    // ✅ LAZY ENGAGEMENT HISTORY LOADING
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

    // Simplified loading logic
    const showLoadingScreen = () => {
        if (sessionLoading) return true;
        if (isAuthenticated && userLoading) return true;
        return false;
    };

    if (showLoadingScreen()) {
        return <DashboardLoading />;
    }

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

            {/* Header */}
            <div className="shrink-0">
                <CombinedDashboardTop
                    profile={profile}
                    historyLoading={historyLoading}
                    total_points={engagementHistory?.total_points || 0}
                    artistsDiscovered={engagementHistory?.artistsDiscovered || 0}
                    weeksActive={engagementHistory?.weekly_summaries?.length || 0}
                />
            </div>
              <Link 
                        href="/discovery-dashboard" 
               className="text-sm px-2 py-1.5 hover:bg-accent rounded-md"
               onClick={handleNavigationClick}
             >
               Rewards
             </Link>

            {/* September Reward Tracker + Module */}
            <div className="px-2 pb-2">
                <div className="max-w-6xl mx-auto">
                    <SeptemberReward />
                </div>
            </div>
        </div>
    );
};

export default DiscoveryDashboard;
