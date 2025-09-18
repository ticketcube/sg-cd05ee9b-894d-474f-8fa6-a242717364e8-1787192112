import React, { useState } from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { MvpSurvey } from '@/components/profile/MvpSurvey';
import { FavoriteArtistsGrid } from '@/components/profile/FavoriteArtistsGrid';
import { User } from 'lucide-react';

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

            <div className="min-h-screen bg-white">
                <div className="max-w-4xl mx-auto px-1 py-1">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 mb-4">
                            <User className="w-4 h-4 text-black" />
                            <span className="text-black font-medium text-sm">Your Profile</span>
                        </div>

                       

                        <p className="text-sm sm:text-base text-gray-600">
                            Manage your account, complete surveys, and explore your favorite artists
                        </p>
                    </div>

                    {/* Profile Card - Compact */}
                    <div className="mb-8">
                        <UserProfileCard />
                    </div>

                    {/* Main Grid */}
                    <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Favorite Artists */}
                        <div className="lg:col-span-2">
                            <FavoriteArtistsGrid />
                        </div>

                        {/* Survey */}
                        <div className="lg:col-span-1">
                            <div className="bg-purple-deep/10 p-4 sm:p-6 rounded-lg shadow-md">
                                <MvpSurvey />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
