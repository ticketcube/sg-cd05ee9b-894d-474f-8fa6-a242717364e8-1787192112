import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { EmbedVoteRating } from '@/components/embed/embedVoteRating';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchCurrentWeekArtists,
    submitArtistVote,
    checkIfAlreadyVoted,
    getOrCreateSessionId,
    type WeeklyVotingArtist,
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

                // Check which artists have been voted on
                const votedSet = new Set<string>();
                for (const artist of fetchedArtists) {
                    const alreadyVoted = await checkIfAlreadyVoted(artist.uuid, userId, week);
                    if (alreadyVoted) {
                        votedSet.add(artist.uuid);
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
            const result = await submitArtistVote(
                currentArtist.uuid,
                weekIdentifier,
                weeklyListId,
                data.x,
                data.y,
                user?.id
            );

            if (result.success) {
                toast.success(`Rating submitted for ${currentArtist.artist_name}!`);

                // Mark this artist as voted
                setVotedArtists(prev => new Set([...prev, currentArtist.uuid]));

                // Check if all artists are now rated
                const newVotedCount = votedArtists.size + 1;
                if (newVotedCount === artists.length) {
                    setAllArtistsRated(true);
                    // Show auth modal or completion message
                    toast.success('All artists rated! Create an account to be eligible for rewards.');
                } else {
                    // Move to next unrated artist
                    moveToNextUnratedArtist();
                }
            } else {
                toast.error(result.error || 'Failed to submit rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error('Failed to submit rating');
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
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading this week's artists...</p>
                </div>
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl">No artists available for this week</p>
                    <p className="text-gray-300 text-sm mt-2">Check back later!</p>
                </div>
            </div>
        );
    }

    if (allArtistsRated && !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
                <div className="max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Thanks for Playing!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            You've rated all {artists.length} artists this week. Create an account to be eligible for rewards and track your points!
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push('/auth/signup')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-bold rounded-lg"
                        >
                            Create Account
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            variant="outline"
                            className="w-full py-6 text-lg font-bold rounded-lg"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Weekly Artist Voting - OTW Chart</title>
                <meta name="description" content="Vote on this week's featured artists" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
                {/* Artist Navigation Tabs */}
<div className="bg-white/20 backdrop-blur-sm border-b border-black/10">
    <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
            
            {/* Previous Button */}
            <Button
                onClick={handlePrevious}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-black/10"
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Artist Tabs */}
            <div className="flex-1 flex justify-center gap-2 overflow-x-auto">
                {artists.map((artist, index) => {
                    const isActive = currentArtistIndex === index;
                    const isVoted = votedArtists.has(artist.uuid);

                    return (
                       <button
    key={artist.uuid}
    onClick={() => handleTabClick(index)}
    className={`
        px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap
        border border-black text-black
        ${currentArtistIndex === index
            ? 'bg-white'
            : 'bg-white/70 hover:bg-white/90'
        }
        ${votedArtists.has(artist.uuid) ? 'ring-2 ring-green-500' : ''}
    `}
>
    {artist.artist_name}
    {votedArtists.has(artist.uuid) && <span className="ml-1">✓</span>}
</button>

                    );
                })}
            </div>

            {/* Next Button */}
            <Button
                onClick={handleNext}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-black/10"
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    </div>
</div>


                {/* Main Content */}
                <div className="max-w-7xl mx-auto p-4">
                    <div className="grid md:grid-cols-2 gap-4 min-h-[600px]">
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
<div className="bg-white rounded-2xl overflow-hidden shadow-2xl text-black">
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

                    {/* Progress Indicator */}
                    <div className="mt-6 text-center">
                        <p className="text-white text-lg font-semibold">
                            Rated {votedArtists.size} of {artists.length} artists
                        </p>
                        <div className="mt-2 max-w-md mx-auto h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                                style={{ width: `${(votedArtists.size / artists.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}