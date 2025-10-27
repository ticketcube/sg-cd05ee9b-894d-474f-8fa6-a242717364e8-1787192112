import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { EmbedVoteRating } from '@/components/embed/embedVoteRating';
import { EmbedVotingCompleteAuth } from '@/components/embed/EmbedVotingCompleteAuth';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchCurrentWeekArtists,
    submitArtistVote,
    checkIfAlreadyVoted,
    getOrCreateSessionId,
    saveVoteLocally,
    getCurrentWeekLocalVotes,
    hasVotedLocallyForArtist,
    type WeeklyVotingArtist,
    type LocalVote,
} from '@/services/embedVotingService';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function WeeklyEmbedPage() {
    const router = useRouter();
    const { user } = useUserProfile();

    const [artists, setArtists] = useState <WeeklyVotingArtist[]>([]);
    const [currentArtistIndex, setCurrentArtistIndex] = useState(0);
    const [weekIdentifier, setWeekIdentifier] = useState<string>('');
    const [weeklyListId, setWeeklyListId] = useState<number|null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [videoWatchTimes, setVideoWatchTimes] = useState <Record<string,number>>({});
    const [votedArtists, setVotedArtists] = useState <Set<string>>(new Set());
    const [allArtistsRated, setAllArtistsRated] = useState(false);

    const currentArtist = artists[currentArtistIndex];
    const sessionId = getOrCreateSessionId();
    const userId = user?.id || sessionId;
    const currentWatchTime = currentArtist ? (videoWatchTimes[currentArtist.uuid] || 0) : 0;

    // Fetch artists on mount
    useEffect(() => {
        const loadArtists = async () => {
            setLoading(true);
            try {
                const { artists: fetchedArtists, weekIdentifier: week, weeklyListId: listId } =
                    await fetchCurrentWeekArtists();

                if (fetchedArtists.length === 0) {
                    toast.error('No artists available for this week');
                    return;
                }

                setArtists(fetchedArtists);
                setWeekIdentifier(week);
                setWeeklyListId(listId);

                   // Check which artists have been voted on (check localStorage first)
                const votedSet = new Set<string>();
                const localVotes = getCurrentWeekLocalVotes(week);
                
                for (const artist of fetchedArtists) {
                    // Check localStorage first
                    const hasLocalVote = hasVotedLocallyForArtist(artist.uuid, week);
                    if (hasLocalVote) {
                        votedSet.add(artist.uuid);
                    } else if (user) {
                        // Only check database if user is logged in
                        const alreadyVoted = await checkIfAlreadyVoted(artist.uuid, userId, week);
                        if (alreadyVoted) {
                            votedSet.add(artist.uuid);
                        }
                    }
                }
                setVotedArtists(votedSet);

                // Check if all artists are already rated
                if (votedSet.size === fetchedArtists.length) {
                    setAllArtistsRated(true);
                }
            } catch (error) {
                console.error('Error loading artists:', error);
                toast.error('Failed to load artists');
            } finally {
                setLoading(false);
            }
        };

        loadArtists();
    }, [userId]);

    // Track video watch time
    useEffect(() => {
        if (!currentArtist || votedArtists.has(currentArtist.uuid)) return;

        const timer = setInterval(() => {
            setVideoWatchTimes(prev => ({
                ...prev,
                [currentArtist.uuid]: Math.min((prev[currentArtist.uuid] || 0) + 1, 10),
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, [currentArtist, votedArtists]);

     const handleRatingSubmit = async (data: { x: number; y: number }) => {
        if (!currentArtist || !weeklyListId) return;

        setIsSubmitting(true);
        try {
            // Save vote to localStorage (no database call yet)
            const localVote: LocalVote = {
                artistUuid: currentArtist.uuid,
                artistName: currentArtist.artist_name,
                weekIdentifier,
                weeklyListId,
                xQuadrant: data.x,
                yQuadrant: data.y,
                timestamp: Date.now(),
            };

            saveVoteLocally(localVote);
            toast.success(`Rating saved for ${currentArtist.artist_name}!`);

            // Mark this artist as voted
            setVotedArtists(prev => new Set([...prev, currentArtist.uuid]));

            // Check if all artists are now rated
            const newVotedCount = votedArtists.size + 1;
            if (newVotedCount === artists.length) {
                setAllArtistsRated(true);
                toast.success('All artists rated! Sign in to save and earn 40 points!');
            } else {
                // Move to next unrated artist
                moveToNextUnratedArtist();
            }
        } catch (error) {
            console.error('Error saving rating:', error);
            toast.error('Failed to save rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    const moveToNextUnratedArtist = () => {
        // Find next unrated artist
        const nextIndex = artists.findIndex(
            (artist, idx) => idx > currentArtistIndex && !votedArtists.has(artist.uuid)
        );

        if (nextIndex !== -1) {
            setCurrentArtistIndex(nextIndex);
        } else {
            // Check if there's an unrated artist before current index
            const prevIndex = artists.findIndex(
                (artist, idx) => idx < currentArtistIndex && !votedArtists.has(artist.uuid)
            );
            if (prevIndex !== -1) {
                setCurrentArtistIndex(prevIndex);
            }
        }
    };

    // Auto-scroll to active tab when index changes
    useEffect(() => {
        if (currentArtist) {
            const tabsContainer = document.querySelector('.artist-tabs-container');
            const activeTab = document.querySelector(`[data-artist-index="${currentArtistIndex}"]`);
            
            if (tabsContainer && activeTab) {
                const containerWidth = (tabsContainer as HTMLElement).clientWidth;
                const tabLeft = (activeTab as HTMLElement).offsetLeft;
                const tabWidth = (activeTab as HTMLElement).offsetWidth;
                
                // Scroll to center the active tab
                const scrollPosition = tabLeft - (containerWidth / 2) + (tabWidth / 2);
                (tabsContainer as HTMLElement).scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentArtistIndex, currentArtist]);

    const handleTabClick = (index: number) => {
        setCurrentArtistIndex(index);
    };

    const handlePrevious = () => {
        setCurrentArtistIndex(prev => (prev > 0 ? prev - 1 : artists.length - 1));
    };

    const handleNext = () => {
        setCurrentArtistIndex(prev => (prev < artists.length - 1 ? prev + 1 : 0));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading this week's artists...</p>
                </div>
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                    <p className="text-white text-xl">No artists available for this week</p>
                    <p className="text-gray-300 text-sm mt-2">Check back later!</p>
                </div>
            </div>
        );
    }

    if (allArtistsRated && !user) {
        return (
            <EmbedVotingCompleteAuth
                artistCount={artists.length}
                pointsToEarn={artists.length * 10}
            />
        );
    }

    return (
        <>
            <Head>
                <title>Weekly Artist Voting - OTW Live</title>
                <meta name="description" content="Vote on this week's featured artists" />
            </Head>
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight mb-6 lg:mb-6 text-center">
                Discover This Week's Rising Stars!
            </h1>

            <div className="min-height:100vh bg-purple-deep rounded-2xl">
                {/* Artist Navigation Tabs */}
                <div className="bg-purple-deep rounded-2xl ">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center justify-between gap-2">
                            
                            {/* Previous Button */}
                            <Button
                                onClick={handlePrevious}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </Button>

                    {/* Artist Tabs */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide artist-tabs-container">
                        <div className="flex items-center gap-2 min-w-max px-12">
                            {artists.map((artist, index) => {
                                const isActive = currentArtistIndex === index;
                                const isVoted = votedArtists.has(artist.uuid);

                                return (
                                    <button
                                        key={artist.uuid}
                                        data-artist-index={index}
                                        onClick={() => handleTabClick(index)}
                                        className={`
                                            px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0
                                            ${isActive
                                                ? 'bg-white text-black shadow-lg scale-105'
                                                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                                            }
                                        `}
                                    >
                                        {artist.artist_name}
                                        {isVoted && <span className="ml-1">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                            {/* Next Button */}
                            <Button
                                onClick={handleNext}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Minimal padding */}
                <div className="max-w-7xl mx-auto px-2 py-2">
                    <div className="grid md:grid-cols-2 gap-2">
                        {/* Video Section */}
                        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                            {currentArtist && (
                                <div className="aspect-video w-full">
                                    <ArtistVideoPlayer
                                        artist={currentArtist}
                                        isEmbed={true}
                                        className="w-full h-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Rating Section */}
                        <div className="rounded-2xl overflow-hidden shadow-2xl h-full">
                            {currentArtist && (
                                <EmbedVoteRating
                                    artistName={currentArtist.artist_name}
                                    onSubmit={handleRatingSubmit}
                                    isSubmitting={isSubmitting}
                                    alreadyVoted={votedArtists.has(currentArtist.uuid)}
                                    videoWatchTime={currentWatchTime}
                                    minWatchTime={10}
                                />
                            )}
                        </div>
                    </div>

                    {/* Progress Indicator - Compact with no extra spacing */}
                    <div className="mt-2 pb-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                            <p className="text-white text-sm font-semibold">
                                Rated {votedArtists.size} of {artists.length} artists
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}