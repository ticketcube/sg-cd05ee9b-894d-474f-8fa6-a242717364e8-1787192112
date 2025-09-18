import React, { useState } from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { MvpSurvey } from '@/components/profile/MvpSurvey';
import { FavoriteArtistsGrid } from '@/components/profile/FavoriteArtistsGrid';
import { UserEngagementQuadrants } from '@/components/profile/UserEngagementQuadrants';

export default function ProfilePage() {
    const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    if (profileLoading) return <DashboardLoading />;
    if (!isAuthenticated)
        return (
            <DashboardAuthBlock
                showAuthDialog={showAuthDialog}
                setShowAuthDialog={setShowAuthDialog}
            />
        );

    return (
        <>
            <Head>
                <title>Profile - OTW Chart</title>
                <meta
                    name="description"
                    content="Your personal OTW Chart profile, survey, and favorite artists."
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/30">
                {/* Hero Section */}
                <div className="relative bg-white border-b border-gray-100 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    Your Profile
                                </h1>
                                <p className="text-lg text-gray-600 max-w-2xl">
                                    Manage your account, track your favorite artists, and see your music engagement insights.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-0.5">
                                    <div className="bg-white rounded-full px-6 py-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {profile?.total_points || 0}
                                            </div>
                                            <div className="text-sm text-gray-500">Total Points</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Profile Settings Card */}
                    <div className="mb-8">
                        <UserProfileCard />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* Left Column - Favorite Artists */}
                        <div className="lg:col-span-8">
                            <FavoriteArtistsGrid />
                        </div>

                        {/* Right Column - Survey & Quadrants */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* MVP Survey */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="p-6">
                                    <MvpSurvey />
                                </div>
                            </div>

                            {/* Engagement Quadrants */}
                            <div className="hidden lg:block">
                                <UserEngagementQuadrants />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Engagement Quadrants */}
                    <div className="mt-8 lg:hidden">
                        <UserEngagementQuadrants />
                    </div>
                </div>
            </div>
        </>
    );
}
