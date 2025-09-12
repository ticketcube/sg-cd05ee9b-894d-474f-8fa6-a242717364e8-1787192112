import React from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { MvpSurvey } from '@/components/profile/MvpSurvey';
import { FavoriteArtistsGrid } from '@/components/profile/FavoriteArtistsGrid';
import { useState } from 'react';
import { User } from 'lucide-react';

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
      
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Simple Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 mb-6">
              <User className="w-4 h-4 text-black" />
              <span className="text-black font-medium">Your Profile</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
              Welcome, {profile?.username || 'User'}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Manage your account, complete surveys, and explore your favorite artists
            </p>
          </div>

          {/* Clean Layout */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="max-w-2xl mx-auto">
              <UserProfileCard />
            </div>

            {/* Favorite Artists Section */}
            <div className="max-w-4xl mx-auto">
              <FavoriteArtistsGrid />
            </div>

            {/* Survey Section */}
            <div className="max-w-3xl mx-auto">
              <MvpSurvey />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}