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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Music, Award, TrendingUp } from 'lucide-react';

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
        <div className="min-h-screen bg-white">
            <DashboardHeader
                profile={profile}
                historyLoading={statsLoading}
                total_points={dashboardStats.totalPoints}
                artistsRated={dashboardStats.artistsRated}
                weeksActive={dashboardStats.weeksActive}
            />
           
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="flex bg-gray-50 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'discover'
                                    ? 'bg-white text-black shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-black'
                            }`}
                        >
                            Discover
                        </button>
                        <button
                            onClick={() => setActiveTab('rewards')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'rewards'
                                    ? 'bg-white text-black shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-black'
                            }`}
                        >
                            Rewards
                        </button>
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'staff'
                                    ? 'bg-white text-black shadow-sm border border-gray-200'
                                    : 'text-gray-600 hover:text-black'
                            }`}
                        >
                            Staff Portal
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {activeTab === 'discover' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-white border border-gray-100 hover:border-gray-200 transition-all">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-medium text-black">Weekly Discoveries</CardTitle>
                                        <Play className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <CardDescription className="text-gray-500">
                                        Rate new artists and earn points
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href="/september/rewards">
                                        <Button className="w-full bg-black hover:bg-gray-800 text-white border-0">
                                            Start Rating
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-100 hover:border-gray-200 transition-all">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-medium text-black">Music Exploration</CardTitle>
                                        <Music className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <CardDescription className="text-gray-500">
                                        Discover your next favorite artist
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full border-gray-200 text-black hover:bg-gray-50">
                                        Explore Now
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-gray-100 hover:border-gray-200 transition-all">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-medium text-black">Trending Artists</CardTitle>
                                        <TrendingUp className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <CardDescription className="text-gray-500">
                                        See what's popular right now
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full border-gray-200 text-black hover:bg-gray-50">
                                        View Trends
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="text-center py-16">
                            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-black mb-2">Rewards Coming Soon</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Keep discovering artists to earn points and unlock exclusive rewards
                            </p>
                            <Button className="bg-black hover:bg-gray-800 text-white">
                                Learn More
                            </Button>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="bg-gray-50 rounded-lg p-12 text-center">
                            <h3 className="text-xl font-medium text-black mb-2">Staff Portal</h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                Access administrative tools and features
                            </p>
                            <Button variant="outline" className="border-gray-200 text-black hover:bg-white">
                                Access Portal
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoveryDashboard;