import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import AppLayout from '@/components/layout/AppLayout';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import  DashboardAuthBlock  from '@/components/dashboard/DashboardAuthBlock';
import { SeptemberArtistGrid } from '@/components/september/SeptemberArtistGrid';
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
            return <DashboardAuthBlock />;
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
        <AppLayout>
            <Head>
                <title>September Rewards - OTW</title>
                <meta name="description" content="Participate in this month's special rewards program." />
            </Head>
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        September Rewards
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Discover new artists, share your feedback, and earn exclusive points.
                    </p>
                </div>
                {renderContent()}
            </div>
            <ArtistInteractionModal
                artist={selectedArtist}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRatingComplete={handleRatingComplete}
            />
        </AppLayout>
    );
}