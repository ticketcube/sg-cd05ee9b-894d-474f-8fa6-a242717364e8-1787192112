import React, { useState } from 'react';
import Link from 'next/link';

// Component Imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TabNavigation from '@/components/dashboard/TabNavigation';
import DiscoverMoreTab from '@/components/dashboard/DiscoverMoreTab';
import MoreRewardsTab from '@/components/dashboard/MoreRewardsTab';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import HeroVideo from '@/components/dashboard/HeroVideo';
import { Button } from '@/components/ui/button';

// Hook & Context Imports
import { useUserProfile } from '@/contexts/UserProfileContext';
import { usePointsOnboarding } from '@/hooks/usePointsOnboarding';

const DiscoveryDashboard = () => {
    const { profile, loading: userLoading } = useUserProfile();
    const [activeTab, setActiveTab] = useState('discover');
    const { showOnboarding, dismiss } = usePointsOnboarding();
    const [showAuthDialog, setShowAuthDialog] = useState(false);

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
                return <DiscoverMoreTab />;
        }
    };

    return (
        <>
            <DashboardHeader
                profile={profile}
                historyLoading={false} // Placeholder
                total_points={profile.total_points || 0}
                totalVotes={0} // Placeholder
                weeksActive={1} // Placeholder
            />
           
            <div className="container mx-auto px-4 py-8 text-center">
                <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    role={profile?.role || null}
                />
                <div className="mt-8">{renderContent()}</div>
            </div>
        </>
    );
};

export default DiscoveryDashboard;