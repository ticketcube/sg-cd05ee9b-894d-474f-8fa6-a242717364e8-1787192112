
import React from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { MvpSurvey } from '@/components/profile/MvpSurvey';
import { FavoriteArtistsGrid } from '@/components/profile/FavoriteArtistsGrid';
import { useState } from 'react';

export default function ProfilePage() {
  const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  if (profileLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthenticated) {
    return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
  }

  return (
    <>
      <Head>
        <title>Profile - OTW Chart</title>
        <meta name="description" content="Your personal OTW Chart profile, survey, and favorite artists." />
      </Head>
      
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
          {/* Compact Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-neutral-200 to-white bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="text-sm md:text-base text-neutral-400">
              Manage your account, complete surveys, and explore your favorite artists
            </p>
          </div>

          {/* Mobile-First Layout */}
          <div className="space-y-6">
            {/* Compact Profile Card - Full width on mobile, constrained on desktop */}
            <div className="max-w-md mx-auto">
              <UserProfileCard />
            </div>

            {/* Survey Section */}
            <div>
              <MvpSurvey />
            </div>

            {/* Favorite Artists Section */}
            <div>
              <FavoriteArtistsGrid />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
