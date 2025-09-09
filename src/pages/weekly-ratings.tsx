
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Component Imports
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TabNavigation from '@/components/dashboard/TabNavigation';
import DiscoverMoreTab from '@/components/dashboard/DiscoverMoreTab';
import MoreRewardsTab from '@/components/dashboard/MoreRewardsTab';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import HeroVideo from '@/components/dashboard/HeroVideo';
import HowPointsWorkModal from '@/components/points/HowPointsWorkModal';
import { Button } from '@/components/ui/button';
import { septemberRewardsService, WeeklyList, WeeklyListArtist } from '@/services/septemberRewardsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SeptemberArtistGrid from '@/components/september/SeptemberArtistGrid';
import SeptemberVideoPopup from '@/components/september/SeptemberVideoPopup';
import SeptemberRatingPopup from '@/components/september/SeptemberRatingPopup';
import { Trophy, Star, Calendar } from 'lucide-react';

// Hook & Context Imports
import { useUserProfile } from '@/contexts/UserProfileContext';
import { usePointsOnboarding } from '@/hooks/usePointsOnboarding';

const SeptemberRewards = () => {

    const { profile, loading: userLoading } = useUserProfile();
    const [weeklyLists, setWeeklyLists] = useState < WeeklyList[] > ([]);
    const [selectedListId, setSelectedListId] = useState < string | null > (null);
    const [artists, setArtists] = useState < WeeklyListArtist[] > ([]);
    const [loading, setLoading] = useState(true);
    const [loadingArtists, setLoadingArtists] = useState(false);
    const [error, setError] = useState < string | null > (null);
    const [selectedArtist, setSelectedArtist] = useState < WeeklyListArtist | null > (null);
    const [showVideoPopup, setShowVideoPopup] = useState(false);
    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [userPoints, setUserPoints] = useState(0);
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    if (userLoading) {
        return <DashboardLoading />;
    }

    if (!profile) {
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
    }




    // Load weekly lists on component mount
    useEffect(() => {
        loadWeeklyLists();
        if (profile) {
            setUserPoints(profile.total_points || 0);
        }
    }, [profile]);

    // Load artists when a weekly list is selected
    useEffect(() => {
        if (selectedListId) {
            loadArtistsForList(parseInt(selectedListId));
        } else {
            setArtists([]);
        }
    }, [selectedListId]);

    const loadWeeklyLists = async () => {
        try {
            setLoading(true);
            const data = await septemberRewardsService.getActiveWeeklyLists();
            setWeeklyLists(data);

            // Auto-select the first list if available
            if (data.length > 0) {
                setSelectedListId(data[0].id.toString());
            }
        } catch (err) {
            console.error('Error loading weekly lists:', err);
            setError('Failed to load weekly lists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadArtistsForList = async (listId: number) => {
        try {
            setLoadingArtists(true);
            const data = await septemberRewardsService.getArtistsForWeeklyList(listId);
            setArtists(data);
        } catch (err) {
            console.error('Error loading artists for list:', err);
            setError('Failed to load artists. Please try again.');
        } finally {
            setLoadingArtists(false);
        }
    };

    const handleArtistClick = (artist: WeeklyListArtist) => {
        setSelectedArtist(artist);
        setShowVideoPopup(true);
    };

    const handleVideoWatched = () => {
        // Called when the 15-second video watch timer completes
        setShowVideoPopup(false);
        setShowRatingPopup(true);
    };

    const handleRatingComplete = async (artistUuid: string, quadrantX: number, quadrantY: number) => {
        if (!profile || !selectedListId) return;

        try {
            const selectedList = weeklyLists.find(list => list.id.toString() === selectedListId);
            const weekIdentifier = selectedList?.week_identifier || 'default';

            const result = await septemberRewardsService.submitRating(
                profile.user_id,
                artistUuid,
                weekIdentifier,
                quadrantX,
                quadrantY
            );

            if (result.success && result.pointsEarned) {
                setUserPoints(prev => prev + result.pointsEarned!);
                // Show success message or update UI as needed
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
        }

        // Close both popups and clear selected artist
        setShowRatingPopup(false);
        setShowVideoPopup(false);
        setSelectedArtist(null);
    };

    const handleClosePopups = () => {
        setShowVideoPopup(false);
        setShowRatingPopup(false);
        setSelectedArtist(null);
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

            {/* Video Popup - Step 1 */}
            {selectedArtist && showVideoPopup && (
                <SeptemberVideoPopup
                    artist={selectedArtist}
                    isOpen={showVideoPopup}
                    onClose={handleClosePopups}
                    onWatchComplete={handleVideoWatched}
                    weekIdentifier={weeklyLists.find(list => list.id.toString() === selectedListId)?.week_identifier || 'default'}
                />
            )}

            {/* Rating Popup - Step 2 */}
            {selectedArtist && showRatingPopup && (
                <SeptemberRatingPopup
                    artist={selectedArtist}
                    isOpen={showRatingPopup}
                    onClose={handleClosePopups}
                    onRatingComplete={handleRatingComplete}
                />
            )}
        </div>
    );
}

SeptemberRewards.getLayout = function getLayout(page: React.ReactElement) {
    return <AppLayout>{page}</AppLayout>;
};

export default SeptemberRewards;
