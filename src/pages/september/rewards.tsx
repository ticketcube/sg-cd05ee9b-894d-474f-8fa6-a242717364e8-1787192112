
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import AppLayout from '@/components/layout/AppLayout';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import SeptemberArtistGrid  from '@/components/september/SeptemberArtistGrid';
import { ArtistInteractionModal } from '@/components/september/ArtistInteractionModal';
import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from '@/types/weekly';
import { septemberRewardsService } from '@/services/septemberRewardsService';
import { userEngagementService } from '@/services/userEngagementService';
import { EngagementType } from '@/constants/engagementTypes';
import { useToast } from '@/hooks/use-toast';

export default function SeptemberRewardsPage() {
    const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();
    const [enrichedLists, setEnrichedLists] = useState<EnrichedWeeklyList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<EnrichedWeeklyListArtist | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        console.log("📡 useEffect triggered", { isAuthenticated, profileLoading });

        if (isAuthenticated) {
            console.log("✅ Authenticated, loading lists...");
            loadEnrichedWeeklyLists();
        } else if (!profileLoading) {
            console.log("⚠️ Not authenticated, and profile finished loading. Setting loading = false.");
            setLoading(false);
        }
    }, [isAuthenticated, profileLoading]);

    const loadEnrichedWeeklyLists = async () => {
        console.log("🚀 loadEnrichedWeeklyLists called");
        setLoading(true);
        setError(null);

        try {
            const lists = await septemberRewardsService.getActiveEnrichedWeeklyLists();
            console.log("📦 Lists fetched from service:", lists);
            setEnrichedLists(lists);
        } catch (err: any) {
            console.error("❌ Failed to load weekly lists:", err);
            setError('Failed to load rewards. Please try again later.');
        } finally {
            console.log("🔄 Finished loading lists");
            setLoading(false);
        }
    };

    const handleArtistSelect = (artist: EnrichedWeeklyListArtist) => {
        console.log("🎤 Artist selected:", artist);
        setSelectedArtist(artist);
        setIsModalOpen(true);
    };

    const handleRatingComplete = async (artistId: number, data: { x: number; y: number }) => {
        console.log("⭐ Rating submitted:", { artistId, data });
        if (!profile) {
            console.warn("⚠️ No profile found, skipping engagement");
            return;
        }

        try {
            const result = await userEngagementService.recordEngagement({
                userId: profile.id,
                artistId: artistId,
                engagementType: EngagementType.QUADRANT_RATING,
                xQuadrant: data.x,
                yQuadrant: data.y,
            });

            console.log("📊 Engagement result:", result);

            if (result.pointsEarned > 0) {
                toast({
                    title: "Rating Submitted!",
                    description: `You earned ${result.pointsEarned} points.`,
                });
            } else {
                toast({
                    title: "Rating Submitted!",
                    description: `Your feedback is appreciated.`,
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("❌ Failed to submit rating:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to submit rating. You may have already rated this artist.",
            });
        }
    };

    const renderContent = () => {
        console.log("🎬 Rendering content", { loading, profileLoading, error, enrichedLists });

        if (loading || profileLoading) {
            return <DashboardLoading />;
        }

        if (!isAuthenticated) {
            return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
        }

        if (error) {
            return <div className="text-center text-red-500">{error}</div>;
        }

        if (enrichedLists.length === 0) {
            return <div className="text-center text-muted-foreground">No active rewards found this week. Check back soon!</div>;
        }

        return (
            <>
                {enrichedLists.map((list) => {
                    console.log("🎨 Rendering list:", list);
                    return (
                        <div key={list.id} className="mb-12">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">{list.name}</h2>
                            <p className="text-muted-foreground mb-6">{list.description}</p>
                            <SeptemberArtistGrid
                                artists={list.artists}
                                onArtistSelect={handleArtistSelect}
                            />
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Weekly Ratings
                    </h1>
                    <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                    Rate artists and earn points for exclusive rewards!
                </p>
                <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-800 dark:text-blue-200">
                        Your Points: {userPoints}
                    </span>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-3">How it Works</h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">1</div>
                        <p>Click on any artist to watch their video</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
                        <p>Rate them on the quadrant (ticket vs share interest)</p>
                    </div>
                    <div className="text-center">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
                        <p>Earn points for each rating you submit</p>
                    </div>
                </div>
            </div>

            {/* Weekly List Selector */}
            <div className="mb-8">
                <div className="max-w-xs mx-auto">
                    <label htmlFor="weekly-list-selector" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="h-4 w-4" />
                        Select Week
                    </label>
                    <Select onValueChange={setSelectedListId} value={selectedListId || ''} disabled={weeklyLists.length === 0}>
                        <SelectTrigger id="weekly-list-selector">
                            <SelectValue placeholder="Select a week..." />
                        </SelectTrigger>
                        <SelectContent>
                            {weeklyLists.map((list) => (
                                <SelectItem key={list.id} value={list.id.toString()}>
                                    {list.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Loading Artists */}
            {loadingArtists && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Loading artists...</p>
                </div>
            )}

            {/* Artists Grid */}
            {!loadingArtists && selectedListId && (
                <SeptemberArtistGrid
                    artists={artists}
                    onArtistClick={handleArtistClick}
                />
            )}

            {/* No List Selected */}
            {!selectedListId && !loadingArtists && (
                <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select a Week
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Choose a weekly list above to see artists available for rating.
                    </p>
                </div>
            )}
    );
}