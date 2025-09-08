import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TabNavigation } from '@/components/dashboard/TabNavigation';
import { DiscoverMoreTab } from '@/components/dashboard/DiscoverMoreTab';
import { MoreRewardsTab } from '@/components/dashboard/MoreRewardsTab';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';

import { useWeeklyLists } from '@/hooks/useWeeklyLists';

import WeeklyArtistGrid from '@/components/weekly/WeeklyArtistGrid';
import WeeklyError from '@/components/weekly/WeeklyError';
import WeeklyLoading from '@/components/weekly/WeeklyLoading';
import WeeklyRatingsQuadrant from '@/components/weekly/WeeklyRatingsQuadrant';

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
                profile={profile}
                historyLoading={false}
                total_points={profile.total_points || 0}
                totalVotes={0}
                totalVideos={0}
                weeksActive={1}
            />
            <HeroVideo />
            <div className="container mx-auto px-4 py-8">
                <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    role={profile?.role || null}
                />
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