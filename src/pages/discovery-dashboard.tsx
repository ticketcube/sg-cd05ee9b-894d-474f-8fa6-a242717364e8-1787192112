import { useState, useEffect } from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import AppLayout from "@/components/layout/AppLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HeroVideo from "@/components/dashboard/HeroVideo";
import TabNavigation from "@/components/dashboard/TabNavigation";
import DiscoverMoreTab from "@/components/dashboard/DiscoverMoreTab";
import MoreRewardsTab from "@/components/dashboard/MoreRewardsTab";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardAuthBlock from "@/components/dashboard/DashboardAuthBlock";
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";
import WeeklyRatingsQuadrant from "@/components/weekly/WeeklyRatingsQuadrant";
import { usePointsOnboarding } from '@/hooks/usePointsOnboarding';
import { weeklyListService } from '@/services/weeklyListService';
import { WeeklyListWithEnrichedArtists } from '@/types/weekly';
import { WeeklyArtistGrid } from '@/components/weekly/WeeklyArtistGrid';
import { WeeklyError } from '@/components/weekly/WeeklyError';
import { WeeklyLoading } from '@/components/weekly/WeeklyLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

    const DiscoveryDashboard = () => {  
    const { profile, loading: userLoading } = useUserProfile();
    const [activeTab, setActiveTab] = useState('weekly');
    const { showOnboarding, dismiss } = usePointsOnboarding();
        const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [weeklyList, setWeeklyList] = useState<WeeklyListWithEnrichedArtists | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeeklyList = async () => {
            try {
                setIsLoading(true);
                const list = await weeklyListService.getActiveWeeklyListWithArtists();
                setWeeklyList(list);
            } catch (err) {
                setError('Failed to load the weekly list. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeeklyList();
    }, []);

    if (userLoading) {
        return <DashboardLoading />;
    }

    if (!profile) {
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
    }

    const renderContent = () => {
        if (isLoading) return <WeeklyLoading />;
        if (error) return <WeeklyError message={error} />;
        if (!weeklyList || !weeklyList.artists || weeklyList.artists.length === 0) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>This Week's Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The new weekly chart is being prepared. Check back soon!</p>
                    </CardContent>
                </Card>
            );
        }

        switch (activeTab) {
            case 'weekly':
                return <WeeklyArtistGrid artists={weeklyList.artists} onSelect={(artistUuid) => console.log('Selected:', artistUuid)} />;
            case 'quadrant':
                // The dashboard does not have user-specific ratings, so we pass an empty array.
                return <WeeklyRatingsQuadrant ratings={[]} weeklyList={weeklyList} onSelectArtist={() => {}} />;
            case 'discover':
                return <DiscoverMoreTab />;
            case 'rewards':
                return <MoreRewardsTab />;
            default:
                return null;
        }
    };

    return (
        <>
            <DashboardHeader
                points={profile.total_points || 0}
                onHowItWorksClick={() => dismiss()}
            />
            <HeroVideo />
            <div className="container mx-auto px-4 py-8">
                <TabNavigation activeTab={activeTab} />
                <div className="mt-8">{renderContent()}</div>
            </div>
            <HowPointsWorkModal isOpen={showOnboarding} />
        </>
    );
};

DiscoveryDashboard.getLayout = function getLayout(page: React.ReactElement) {
    return <AppLayout>{page}</AppLayout>;
};

export default DiscoveryDashboard;