import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Component Imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TabNavigation from '@/components/dashboard/TabNavigation';
import DiscoverMoreTab from '@/components/dashboard/DiscoverMoreTab';
import MoreRewardsTab from '@/components/dashboard/MoreRewardsTab';
import StaffPortalTab from '@/components/StaffPortalTab';

import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import HeroVideo from '@/components/dashboard/HeroVideo';
import { Button } from '@/components/ui/button';

// Hook & Context Imports
import { useUserProfile } from '@/contexts/UserProfileContext';
import { usePointsOnboarding } from '@/hooks/usePointsOnboarding';
import { dashboardStatsService, DashboardStats } from '@/services/dashboardStatsService';

const DiscoveryDashboard = () => {
    const { profile, loading: userLoading } = useUserProfile();
    const [activeTab, setActiveTab] = useState('discover');
    const { showOnboarding, dismiss } = usePointsOnboarding();
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalPoints: 0,
        artistsRated: 0,
        weeksActive: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    // Fetch dashboard stats when profile is available
    useEffect(() => {
        const fetchStats = async () => {
            if (profile?.user_id) {
                setStatsLoading(true);
                try {
                    const stats = await dashboardStatsService.getUserStats(profile.user_id);
                    setDashboardStats(stats);
                } catch (error) {
                    console.error('Error fetching dashboard stats:', error);
                } finally {
                    setStatsLoading(false);
                }
            }
        };

        fetchStats();
    }, [profile?.user_id]);

    if (userLoading) {
        return <DashboardLoading />;
    }

    if (!profile) {
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'discover':
                return <DiscoverMoreTab />;
            case 'rewards':
                return <MoreRewardsTab />;
            default:
                return <StaffPortalTab />;
        }
    };

    return (
        <>
            <DashboardHeader
                profile={profile}
                historyLoading={statsLoading}
                total_points={dashboardStats.totalPoints}
                total_engagements={dashboardStats.artistsRated}
                weeksActive={dashboardStats.weeksActive}
            />
           
          
        </>
    );
};

export default DiscoveryDashboard;