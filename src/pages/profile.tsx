import React, { useState } from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { MvpSurvey } from '@/components/profile/MvpSurvey';
import { FavoriteArtistsGrid } from '@/components/profile/FavoriteArtistsGrid';
import { UserEngagementQuadrants } from '@/components/profile/UserEngagementQuadrants';
import { Trophy, Star } from 'lucide-react';

export default function ProfilePage() {
    const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    if (profileLoading) return <DashboardLoading />;
    if (!isAuthenticated) {
        return (
            <DashboardAuthBlock
                showAuthDialog={showAuthDialog}
                setShowAuthDialog={setShowAuthDialog}
            />
        );
    }

    return (
        <>
            <Head>
                <title>Profile - OTW Chart</title>
                <meta
                    name="description"
                    content="Your personal OTW Chart profile, surveys, favorite artists, and engagement insights."
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <Trophy className="h-8 w-8 text-yellow-300" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold">Your Profile</h1>
                                    <p className="text-blue-100 mt-1">
                                        Track your music journey and earn rewards
                                    </p>
                                </div>
                            </div>
                            
                            {profile && (
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold flex items-center gap-2">
                                            <Star className="h-6 w-6 text-yellow-300" />
                                            {profile.total_points || 0}
                                        </div>
                                        <div className="text-blue-100 text-sm">Total Points</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Profile Settings */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <UserProfileCard />
                            </div>

                            {/* Favorite Artists */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <FavoriteArtistsGrid />
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Survey Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <MvpSurvey />
                            </div>

                            {/* Engagement Insights */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <UserEngagementQuadrants />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
