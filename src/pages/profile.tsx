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
      
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Manage your account, complete surveys for points, and explore your favorite artists
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <UserProfileCard />
            </div>

            {/* Right Column - Survey and Artists */}
            <div className="lg:col-span-2 space-y-8">
              {/* MVP Survey */}
              <MvpSurvey />

              {/* Favorite Artists Grid */}
              <FavoriteArtistsGrid />
            </div>
          </div>

          {/* Bottom Stats Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-neutral-50 to-white rounded-3xl p-8 border border-neutral-200/60 shadow-lg shadow-neutral-900/5">
              <h2 className="text-2xl font-semibold text-neutral-800 text-center mb-8">
                Your OTW Chart Journey
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200/40 hover:border-neutral-300/60 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">{profile?.total_points || 0}</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-600">Total Points</div>
                  <div className="text-xs text-neutral-500 mt-1">Keep earning more!</div>
                </div>

                <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200/40 hover:border-neutral-300/60 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">🎵</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-600">Music Discovery</div>
                  <div className="text-xs text-neutral-500 mt-1">Exploring new artists</div>
                </div>

                <div className="text-center p-6 bg-white rounded-2xl border border-neutral-200/40 hover:border-neutral-300/60 transition-colors duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">⭐</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-600">Community Member</div>
                  <div className="text-xs text-neutral-500 mt-1">Part of OTW Chart</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}