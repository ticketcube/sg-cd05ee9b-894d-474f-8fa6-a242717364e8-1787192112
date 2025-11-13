import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ArtistVideoPlayer from '@/components/ArtistVideoPlayer';
import { EmbedVoteRating } from '@/components/embed/embedVoteRating';
import { EmbedVotingCompleteAuth } from '@/components/embed/EmbedVotingCompleteAuth';
import { OnestoWatchCubeEmbed } from '@/components/OnestoWatchCubeEmbed';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface ClassOf2025Artist {
    uuid: string;
    artist_name: string;
    youtube_url?: string;
    artist_image?: string;
}

export default function ClassOf2025Page() {
    const router = useRouter();
    const { user } = useUserProfile();

    const [artists, setArtists] = useState<ClassOf2025Artist[]>([]);
    const [currentArtistIndex, setCurrentArtistIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const currentArtist = artists[currentArtistIndex];

    // Fetch artists on mount - filter by TopList = "ClassOf"
    useEffect(() => {
        const loadArtists = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('artists')
                    .select('uuid, artist_name, youtube_url, artist_image')
                    .eq('Top_List', 'ClassOf')
                    .order('artist_name');

                if (error) throw error;

                if (!data || data.length === 0) {
                    toast.error('No Class of 2025 artists available');
                    return;
                }

                setArtists(data);
            } catch (error) {
                console.error('Error loading artists:', error);
                toast.error('Failed to load artists');
            } finally {
                setLoading(false);
            }
        };

        loadArtists();
    }, []);

    // Auto-scroll to active tab when index changes
    useEffect(() => {
        if (currentArtist) {
            const tabsContainer = document.querySelector('.artist-tabs-container');
            const activeTab = document.querySelector(`[data-artist-index="${currentArtistIndex}"]`);
            
            if (tabsContainer && activeTab) {
                const containerWidth = (tabsContainer as HTMLElement).clientWidth;
                const tabLeft = (activeTab as HTMLElement).offsetLeft;
                const tabWidth = (activeTab as HTMLElement).offsetWidth;
                
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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
                    <p className="text-black text-lg">Loading Class of 2025 artists...</p>
                </div>
            </div>
        );
    }

    if (artists.length === 0) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-black text-xl">No Class of 2025 artists available</p>
                    <p className="text-gray-600 text-sm mt-2">Check back later!</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>OTW Class of 2025 - Discovery Reward</title>
                <meta name="description" content="Discover the Class of 2025 artists" />
            </Head>
            
            {/* Title and Subheader */}
            <div className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 text-black">
                    OTW Class of 2025
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 font-medium">
                    Discovery Reward presented by TicketCube™
                </p>
            </div>

            <div className="min-h-screen bg-white">
                {/* Artist Navigation Tabs - Black and White */}
                <div className="bg-black rounded-2xl shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-2">
                        <div className="flex items-center justify-between gap-2">
                            {/* Previous Button */}
                            <Button
                                onClick={handlePrevious}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 md:w-12 md:h-12 w-10 h-10"
                            >
                                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                            </Button>

                            {/* Artist Tabs */}
                            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide artist-tabs-container">
                                <div className="flex items-center gap-2 min-w-max px-2 sm:px-6 justify-start sm:justify-center w-[45vw] sm:w-auto">
                                    {artists.map((artist, index) => {
                                        const isActive = currentArtistIndex === index;

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
                                className="text-white hover:bg-white/20 md:w-12 md:h-12 w-10 h-10"
                            >
                                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Video and Cube Embed Section */}
                <div className="max-w-7xl mx-auto px-2 py-2">
                    <div className="grid md:grid-cols-2 gap-2">
                        {/* Video Section */}
                        <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
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

                        {/* TicketCube Embed Section - Replaces Rating */}
                        <div className="rounded-2xl overflow-hidden shadow-xl h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                            {currentArtist && (
                                <OnestoWatchCubeEmbed
                                    artistId={currentArtist.uuid}
                                    artistName={currentArtist.artist_name}
                                    artistImage={currentArtist.artist_image}
                                    referralSource="classof2025"
                                />
                            )}
                        </div>
                    </div>

                    {/* Bottom Banner - Claim Your Free TicketCube */}
                    <div className="mt-2 pb-2">
                        <div className="bg-black rounded-lg px-4 py-3 text-center">
                            <p className="text-white text-base sm:text-lg font-bold">
                                CLAIM YOUR FREE TICKETCUBE
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}