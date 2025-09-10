import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardAuthBlock } from "@/components/dashboard/DashboardAuthBlock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { septemberRewardsService } from "@/services/septemberRewardsService";
import { EnrichedWeeklyList, EnrichedWeeklyListArtist } from "@/types/weekly";
import { SeptemberArtistGrid } from "@/components/september/SeptemberArtistGrid";
import { ArtistInteractionModal } from "@/components/september/ArtistInteractionModal";
import { useToast } from "@/hooks/use-toast";
import { SubmissionSuccessPopup } from "@/components/points/SubmissionSuccessPopup";

function SeptemberRewardsPage() {
    const { user, loading: userLoading } = useUserProfile();
    const { toast } = useToast();

    const [weeklyLists, setWeeklyLists] = useState < EnrichedWeeklyList[] > ([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

    const [selectedArtist, setSelectedArtist] = useState < EnrichedWeeklyListArtist | null > (null);
    const [currentListId, setCurrentListId] = useState < number | null > (null); // <-- ADDED

    const [successInfo, setSuccessInfo] = useState < { points: number; message: string } | null > (null);

    useEffect(() => {
        const loadEnrichedWeeklyLists = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const data = await septemberRewardsService.getActiveEnrichedWeeklyLists();
                setWeeklyLists(data);
                setError(null);
            } catch (err: any) {
                console.error("Failed to load weekly lists:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading) {
            loadEnrichedWeeklyLists();
        }
    }, [user, userLoading]);

    const handleArtistClick = (artist: EnrichedWeeklyListArtist, listId: number) => { // <-- MODIFIED
        setSelectedArtist(artist);
        setCurrentListId(listId); // <-- ADDED
    };

    const handleModalClose = () => {
        setSelectedArtist(null);
        setCurrentListId(null); // <-- ADDED
    };

    const handleRatingComplete = async (artistId: number, ratingData: { x: number; y: number }) => {
        console.log(`Submitting rating for artist ${artistId}`, ratingData);
        try {
            const result = await septemberRewardsService.submitRating(artistId, ratingData);
            handleModalClose(); // Close the main modal first

            // Then show the success popup
            setSuccessInfo({
                points: result.pointsEarned,
                message: "Rating submitted successfully!",
            });

            toast({
                title: "Rating Submitted!",
                description: `You earned ${result.pointsEarned} points.`,
            });

        } catch (error: any) {
            console.error("Failed to submit rating:", error);
            toast({
                title: "Error",
                description: error.message || "Could not submit rating.",
                variant: "destructive",
            });
        }
    };

    if (userLoading || (loading && !error)) {
        return (
            <AppLayout>
                <DashboardLoading />
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout>
                <DashboardAuthBlock />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <DashboardHeader
                title="September Rewards"
                description="Discover new artists and earn points by watching and rating their videos."
            />

            <main className="p-4 sm:p-6">
                {error && <p className="text-red-500">Error: {error}</p>}

                {weeklyLists.length === 0 && !loading && !error && (
                    <p>No active weekly lists found. Check back soon!</p>
                )}

                {weeklyLists.map((weeklyList) => (
                    <div key={weeklyList.id} className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">
                            {weeklyList.title}
                        </h2>
                        <SeptemberArtistGrid
                            artists={weeklyList.artists}
                            onArtistClick={(artist) => handleArtistClick(artist, weeklyList.id)} // <-- MODIFIED
                        />
                    </div>
                ))}
            </main>

            <ArtistInteractionModal
                isOpen={!!selectedArtist}
                onClose={handleModalClose}
                artist={selectedArtist}
                listId={currentListId} // <-- MODIFIED
                onRatingComplete={handleRatingComplete}
            />

            <SubmissionSuccessPopup
                isOpen={!!successInfo}
                onClose={() => setSuccessInfo(null)}
                pointsEarned={successInfo?.points ?? 0}
                message={successInfo?.message ?? ""}
            />
        </AppLayout>
    );
}

export default SeptemberRewardsPage;