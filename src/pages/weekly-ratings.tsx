import { useState, useEffect, useCallback } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { useUserProfile } from '@/contexts/UserProfileContext';
import { EnrichedWeeklyListArtist, SubmissionResult } from '@/types/weekly';

// --- Custom Hooks ---
import { usePointsOnboarding } from '@/hooks/usePointsOnboarding';
import { useWeeklyLists } from '@/hooks/useWeeklyLists';
import { useWeeklyListDetail } from '@/hooks/useWeeklyListDetail';

// --- UI Components ---
import WeeklyArtistGrid from '@/components/weekly/WeeklyArtistGrid';
import WeeklyEmpty from '@/components/weekly/WeeklyEmpty';
import WeeklyError from '@/components/weekly/WeeklyError';
import WeeklyListSelector from '@/components/weekly/WeeklyListSelector';
import WeeklyLoading from '@/components/weekly/WeeklyLoading';
import WeeklyRatingsQuadrant from '@/components/weekly/WeeklyRatingsQuadrant';
import WeeklyRewardsHeader from '@/components/weekly/WeeklyRewardsHeader';

// --- Popups & Notifications ---
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";
import WeeklyArtistRatingPopup from "@/components/WeeklyArtistRatingPopup";
import SubmissionSuccessPopup from "@/components/points/SubmissionSuccessPopup";
import { usePointsNotifications } from '@/components/points/PointsNotification';
import { useToast } from '@/hooks/use-toast';


export default function WeeklyRatingsPage() {
    const { user } = useUserProfile();
    const { toast } = useToast();

    // --- State Hooks ---
    const { showOnboarding, dismiss } = usePointsOnboarding();
    const { lists, selectedListId, setSelectedListId, loading: listsLoading, error: listsError } = useWeeklyLists();
    const {
        weeklyList,
        artistRatings,
        updateRating,
        markWatched,
        loading: detailLoading,
        error: detailError,
        reload: reloadListDetail
    } = useWeeklyListDetail(selectedListId ? parseInt(selectedListId) : 0, user?.id);

    // --- Local UI State for Popups ---
    const [showHowPointsWork, setShowHowPointsWork] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState<EnrichedWeeklyListArtist | null>(null);
    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // --- Effects ---
    useEffect(() => {
        if (showOnboarding) {
            setShowHowPointsWork(true);
        }
    }, [showOnboarding]);

    // --- Callbacks & Event Handlers ---
    const handleSelectArtist = (artist: EnrichedWeeklyListArtist) => {
        setSelectedArtist(artist);
        setShowRatingPopup(true);
    };

    const handleRatingComplete = useCallback(async (artistId: string, ticketInterest: number, shareInterest: number) => {
        setShowRatingPopup(false);

        const result = await updateRating(artistId, ticketInterest, shareInterest);

        if (result) {
            setSubmissionResult({ 
                message: 'Rating submitted successfully',
                pointsAwarded: 5,
                type: 'rate' 
            });
            setShowSuccessPopup(true);
            toast({ title: "Rating Submitted!", description: "You earned 5 points." });
        } else {
            toast({ title: "Error", description: 'Failed to submit rating', variant: 'destructive' });
        }
    }, [updateRating, toast]);

    const handleVideoPointsAwarded = useCallback(async (artistId: string, points: number) => {
        await markWatched(artistId);
        setSubmissionResult({ 
            message: 'Video watched successfully',
            pointsAwarded: points, 
            type: 'watch' 
        });
        setShowSuccessPopup(true);
        toast({ title: "Video Watched!", description: `You earned ${points} points.` });
    }, [markWatched, toast]);

    const handleCloseSuccessPopup = () => {
        setShowSuccessPopup(false);
        setSubmissionResult(null);
    };

    const handleDismissOnboarding = () => {
        dismiss();
        setShowHowPointsWork(false);
    };

    // --- Render Logic ---
    const isLoading = listsLoading || detailLoading;
    const error = listsError || (detailError instanceof Error ? detailError.message : detailError);

    const renderContent = () => {
        if (isLoading) return <WeeklyLoading />;
        if (error) return <WeeklyError message={error} />;
        if (!weeklyList || weeklyList.artists.length === 0) return <WeeklyEmpty />;

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">Rate Artists</h2>
                    <WeeklyArtistGrid
                        weeklyList={weeklyList}
                        onArtistClick={handleSelectArtist}
                    />
                </div>
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">Your Ratings</h2>
                    <WeeklyRatingsQuadrant
                        artists={weeklyList.artists}
                        ratings={artistRatings}
                        onRating={handleRatingComplete}
                    />
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WeeklyRewardsHeader onShowInfo={() => setShowHowPointsWork(true)} />

                <div className="my-6">
                    {/* Points notification placeholder */}
                </div>

                <div className="mb-8 max-w-sm">
                    <WeeklyListSelector
                        lists={lists}
                        value={selectedListId}
                        onChange={setSelectedListId}
                        disabled={isLoading}
                    />
                </div>

                {renderContent()}
            </div>

            {/* --- Modals & Popups --- */}
            <HowPointsWorkModal
                isOpen={showHowPointsWork}
                onDismiss={handleDismissOnboarding}
                isOnboarding={showOnboarding}
            />

            {selectedArtist && (
                <WeeklyArtistRatingPopup
                    isOpen={showRatingPopup}
                    onClose={() => setShowRatingPopup(false)}
                    artist={selectedArtist}
                    onRatingComplete={handleRatingComplete}
                    weekIdentifier={weeklyList?.week_identifier || ''}
                />
            )}

            {submissionResult && (
                <SubmissionSuccessPopup
                    isOpen={showSuccessPopup}
                    onClose={handleCloseSuccessPopup}
                    message={submissionResult.message}
                    type={submissionResult.type}
                />
            )}
        </AppLayout>
    );
}