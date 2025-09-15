
import React, { useState } from 'react';
import Link from 'next/link';

// Component Imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { SeptemberReward } from '@/components/dashboard/SeptemberReward';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Music, Award, TrendingUp, AlertCircle } from 'lucide-react';

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

    // Loading & auth handling
    if (sessionLoading || userLoading) return <DashboardLoading />;
    if (!isAuthenticated || !profile || !user)
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;

    return (
        <div className="min-h-screen bg-white">
            {historyError && (
                <div className="bg-red-50 border border-red-200 p-3">
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

            <DashboardHeader
                profile={profile}
                historyLoading={historyLoading}
                total_points={engagementHistory?.total_points || 0}
                artistsDiscovered={engagementHistory?.artistsDiscovered || 0}
                weeksActive={engagementHistory?.weekly_summaries?.length || 0}
            />

            <div className="max-w-6xl mx-auto px-2 py-4">
                <SeptemberReward />
            </div>
        </div>
    );
};

export default DiscoveryDashboard;
