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
      <div className="max-w-4xl mx-auto px-2 py-2">
        {/* Header */}

        {/* Profile Card - Compact */}
        <div className="mb-6">
          <UserProfileCard />
        </div>

        {/* Main Grid */}
        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Favorite Artists */}
          <div className="lg:col-span-2 overflow-hidden">
            <div className="bg-white rounded-lg shadow-md h-full overflow-hidden max-w-full">
              <FavoriteArtistsGrid />
            </div>
          </div>

          {/* Survey */}
          <div className="lg:col-span-1 overflow-hidden">
            <div className="bg-purple-deep/10 p-4 sm:p-6 rounded-lg shadow-md h-full overflow-hidden max-w-full">
              <MvpSurvey />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

