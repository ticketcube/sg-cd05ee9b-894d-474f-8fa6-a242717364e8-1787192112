
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Star, Calendar } from 'lucide-react';

// Component Imports
import AppLayout from '@/components/layout/AppLayout';
import SeptemberArtistGrid from '@/components/september/SeptemberArtistGrid';
import ArtistInteractionModal from '@/components/september/ArtistInteractionModal';
import { SubmissionSuccessPopup } from "@/components/points/SubmissionSuccessPopup";
import { Button } from '@/components/ui/button';

// Service, Type, and Hook Imports
import { septemberRewardsService } from '@/services/septemberRewardsService';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { EnrichedWeeklyList, EnrichedWeeklyListArtist, SubmissionResult } from '@/types/weekly';
import { useToast } from "@/hooks/use-toast";


const SeptemberRewardsPage = () => {
    const { profile } = useUserProfile();
    const { toast } = useToast();

    const [enrichedLists, setEnrichedLists] = useState<EnrichedWeeklyList[]>([]);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedArtist, setSelectedArtist] = useState<EnrichedWeeklyListArtist | null>(null);
    const [userPoints, setUserPoints] = useState(0);

    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [isSuccessPopupOpen, setSuccessPopupOpen] = useState(false);

    useEffect(() => {
        if (profile) {
            loadEnrichedWeeklyLists();
            setUserPoints(profile.total_points || 0);
        }
    }, [profile]);

    const loadEnrichedWeeklyLists = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await septemberRewardsService.getActiveEnrichedWeeklyLists();
            setEnrichedLists(data);
            if (data.length > 0) {
                setSelectedListId(data[0].id.toString());
            }
        } catch (err) {
            console.error('Error loading enriched weekly lists:', err);
            setError('Failed to load weekly lists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingComplete = async (artistId: number, data: { x: number; y: number }) => {
        try {
            setLoading(true);
            const result = await septemberRewardsService.submitRating(artistId, data.x, data.y);

            if (result) {
                setSubmissionResult(result);
                setSuccessPopupOpen(true);
                // Optimistically update points
                setUserPoints(prev => prev + (result.pointsEarned || 0));
            }
            setSelectedArtist(null); // Close the interaction modal
        } catch (error) {
            console.error("Failed to submit rating:", error);
            toast({
                title: "Error",
                description: "There was a problem submitting your rating.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const currentArtists = enrichedLists.find(list => list.id.toString() === selectedListId)?.artists || [];

    return (
        <AppLayout>
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
                            <p>Click an artist to watch & rate them</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
                            <p>Adjust sliders for ticket & share interest</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
                            <p>Earn points for every rating you submit</p>
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
                        <Select onValueChange={setSelectedListId} value={selectedListId || ''} disabled={enrichedLists.length === 0}>
                            <SelectTrigger id="weekly-list-selector">
                                <SelectValue placeholder="Select a week..." />
                            </SelectTrigger>
                            <SelectContent>
                                {enrichedLists.map((list) => (
                                    <SelectItem key={list.id} value={list.id.toString()}>
                                        {list.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Loading...</p>
                    </div>
                )}

                {/* Content Area */}
                {!loading && !error && (
                    <>
                        {selectedListId && currentArtists.length > 0 && (
                            <SeptemberArtistGrid
                                artists={currentArtists}
                                onArtistClick={setSelectedArtist}
                            />
                        )}
                        {!selectedListId && (
                             <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Week</h3>
                                <p className="text-gray-600 dark:text-gray-300">Choose a weekly list to see available artists.</p>
                            </div>
                        )}
                        {selectedListId && currentArtists.length === 0 && (
                            <div className="text-center py-12">
                                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Artists Available</h3>
                                <p className="text-gray-600 dark:text-gray-300">There are no artists for this week yet.</p>
                            </div>
                        )}
                    </>
                )}
                
                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                            <p>{error}</p>
                            <Button onClick={loadEnrichedWeeklyLists} className="mt-2" variant="outline">
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <ArtistInteractionModal
                    artist={selectedArtist}
                    isOpen={!!selectedArtist}
                    onClose={() => setSelectedArtist(null)}
                    onRatingComplete={handleRatingComplete}
                    listId={currentListId}
                />
                
                <SubmissionSuccessPopup
                    isOpen={isSuccessPopupOpen}
                    onClose={() => setSuccessPopupOpen(false)}
                    pointsEarned={submissionResult?.pointsEarned ?? 0}
                    message={submissionResult?.message ?? "Your rating has been submitted!"}
                />
            </div>
        </AppLayout>
    );
};

export default SeptemberRewardsPage;
