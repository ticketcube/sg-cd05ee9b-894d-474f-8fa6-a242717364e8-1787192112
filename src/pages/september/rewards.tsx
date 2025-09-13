import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useUserProfile } from '@/contexts/UserProfileContext';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import SeptemberArtistGrid from '@/components/september/SeptemberArtistGrid';
import { ArtistInteractionModal } from '@/components/september/ArtistInteractionModal';
import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from '@/types/weekly';
import { septemberRewardsService } from '@/services/septemberRewardsService';
import { userEngagementService } from '@/services/userEngagementService';
import { toast } from 'sonner';
import { SeptemberReward } from '@/components/dashboard/SeptemberReward';

export default function SeptemberRewardsPage() {
    const { profile, loading: profileLoading, isAuthenticated } = useUserProfile();
    const [enrichedLists, setEnrichedLists] = useState<EnrichedWeeklyList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<EnrichedWeeklyListArtist | null>(null);
    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [selectedWeekIdentifier, setSelectedWeekIdentifier] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);

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

            if (lists && lists.length > 0 && lists[0].artists && lists[0].artists.length > 0) {
                console.log("🕵️ INSPECTING FIRST ARTIST OF FIRST LIST:", lists[0].artists[0]);
            }

            setEnrichedLists(lists);
        } catch (err: any) {
            console.error("❌ Failed to load weekly lists:", err);
            setError('Failed to load rewards. Please try again later.');
        } finally {
            console.log("🔄 Finished loading lists");
            setLoading(false);
        }
    };

    const handleArtistSelect = (artist: EnrichedWeeklyListArtist, listId: number) => {
        const list = enrichedLists.find(l => l.id === listId);
        if (!list) return;

        console.log("🎤 Artist selected:", artist, "from list:", listId);
        setSelectedArtist(artist);
        setSelectedListId(listId);
        setSelectedWeekIdentifier(list.week_identifier);
        setIsModalOpen(true);
    };

    const handleRatingComplete = async (artistId: number, data: { x: number; y: number }) => {
        console.log("⭐ Rating submitted:", { artistId, data });
        if (!profile?.user_id) {
            console.warn("⚠️ No user ID found, skipping engagement");
            return;
        }

        // Find the current list to get week_identifier
        const currentList = enrichedLists.find(list => list.id === selectedListId);
        if (!currentList) {
            console.error("❌ Could not find current list");
            return;
        }

        // Find the artist to get their UUID
        const artist = currentList.artists.find(a => a.id === artistId);
        if (!artist) {
            console.error("❌ Could not find artist");
            return;
        }

        try {
            const result = await userEngagementService.recordEngagement({
                userId: profile.user_id,
                engagementType: 'quadrant', // Use the action name from points_config
                artistUuid: artist.uuid,
                weekIdentifier: currentList.week_identifier,
                x_quadrant: data.x,
                y_quadrant: data.y,
                additionalData: {
                    weekly_list_id: selectedListId,
                    artist_name: artist.artist_name
                }
            });

            console.log("📊 Engagement result:", result);

            if (result.success) {
                if (result.pointsEarned && result.pointsEarned > 0) {
                    toast.success(`🎉 Rating Submitted!`, {
                        description: `You earned ${result.pointsEarned} points for rating ${artist.artist_name}.`,
                        duration: 4000,
                    });
                } else {
                    toast.success('✅ Rating Submitted!', {
                        description: `Your rating for ${artist.artist_name} has been recorded.`,
                        duration: 3000,
                    });
                }
            } else {
                toast.error('Already Rated', {
                    description: result.error || "You may have already rated this artist.",
                    duration: 3000,
                });
            }

            // Close the modal after rating is submitted
            handleModalClose();
        } catch (error) {
            console.error("❌ Failed to submit rating:", error);
            toast.error('Error', {
                description: "Failed to submit rating. Please try again.",
                duration: 3000,
            });
            // Still close the modal even if there's an error
            handleModalClose();
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        // Delay resetting the artist to prevent content from disappearing before the modal finishes its closing animation
        setTimeout(() => {
            setSelectedArtist(null);
            setSelectedListId(null);
            setSelectedWeekIdentifier(null);
        }, 300);
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
                            <h2 className="text-3xl font-bold tracking-tight mb-4">{list.title}</h2>
                            <p className="text-muted-foreground mb-6">{list.description}</p>
                            <SeptemberArtistGrid
                                artists={list.artists}
                                onArtistSelect={(artist) => handleArtistSelect(artist, list.id)}
                            />
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <>
            <Head>
                <title>Weekly Artist Discovery - OTW</title>
                <meta name="description" content="Participate in this month's special rewards program." />
            </Head>
            <div className="container mx-auto px-2 py-2">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
                       September Discovery Challenge!
                    </h1>
                    <p className="mt-4 text-sm text-muted-foreground pb-2" >
                      Select an artist. Watch for >15 second. Rate with sliders.  Earn 10 points!
                    </p>
                  
                </div>
                {renderContent()}
            </div>
            <ArtistInteractionModal
                artist={selectedArtist}
                listId={selectedListId}
                weekIdentifier={selectedWeekIdentifier}
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onRatingComplete={handleRatingComplete}
            />
        </>
    );
}