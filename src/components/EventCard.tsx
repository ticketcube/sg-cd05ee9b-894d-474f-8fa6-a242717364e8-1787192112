import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Ticket, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { generateTicketCubeLink } from "@/lib/ticketcube";

interface EventCardProps {
    event: {
        event_id: string;
        event_name: string;
        event_date: string;
        event_time: string | null;
        venue_name: string;
        venue_city: string;
        venue_state: string | null;
        venue_country: string;
        event_url: string;
        artist_name?: string | null;
        artist_image?: string | null;
        artist_videolink?: string | null;
        primary_venue_image?: string | null;
        primary_event_image?: string | null;
        primary_attraction_image?: string | null;
    };
}

export function EventCard({ event }: EventCardProps) {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const artistForPlayer = {
        artist_name: event.artist_name || event.event_name,
        artist_videolink: event.artist_videolink || null,
        artist_image: event.artist_image || null,
    };

      const hasVideo = event.artist_videolink && event.artist_videolink.trim() !== "";
    
    // Artist Image Fallback: artist_image → primary_attraction_image → primary_event_image → default
    const artistImage = event.artist_image && event.artist_image !== "null"
        ? event.primary_attraction_image
        : event.artist_image && event.primary_attraction_image !== "null"
        ? event.primary_attraction_image
        : event.primary_event_image && event.primary_event_image !== "null"
        ? event.primary_event_image
        : "/otwcolor-md6dlfkk.png";
    
    // Venue Image Fallback: primary_venue_image → primary_event_image → default
    const venueImage = event.primary_venue_image && event.primary_venue_image !== "null"
        ? event.primary_venue_image
        : event.primary_event_image && event.primary_event_image !== "null"
        ? event.primary_event_image
        : "/otwcolor-md6dlfkk.png";
    return (
        <>
            <Card className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-0">
                    {/* 16:9 Aspect Ratio Container */}
                    <div className="relative aspect-video w-full">
                        {/* Background Image */}
                        <Image
                            src={artistImage}
                            alt={event.artist_name || event.event_name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            priority={false}
                        />

                        {/* Dark Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Text Overlay - Lower Left */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                            <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-2 drop-shadow-lg">
                                {event.artist_name || event.event_name}
                            </h3>
                            <p className="text-white/90 text-sm md:text-base font-normal drop-shadow-lg">
                                {event.venue_name}
                            </p>
                        </div>

                        {/* Action Buttons - Right Side */}
                        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                            {/* Play Video Button */}
                            {hasVideo ? (
                                <button
                                    onClick={() => setIsVideoModalOpen(true)}
                                    className="bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
                                    title="Watch Video"
                                >
                                    <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-black" />
                                </button>
                            ) : (
                                <div
                                    className="bg-gray-400/50 p-2 md:p-3 rounded-full shadow-lg cursor-not-allowed"
                                    title="No video available"
                                >
                                    <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-white/50" />
                                </div>
                            )}

                            {/* Buy Tickets Button */}
                            <a
                                href={event.event_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/90 hover:bg-white p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                title="Buy Tickets"
                            >
                                <Ticket className="w-5 h-5 md:w-6 md:h-6 text-black" />
                            </a>

                            {/* OTW Live Button - Coming Soon */}
                            {/* OTW Live Button - TicketCube Link */}
                            <button
                                onClick={() => {
                                    const ticketCubeUrl = generateTicketCubeLink({
                                        otw_event_id: event.event_id,
                                        artist_slug: undefined, // We'll add this to DB later
                                        event_date: event.event_date,
                                        event_time: event.event_time,
                                        venue: event.venue_name,
                                        venue_city: event.venue_city,
                                        venue_state: event.venue_state,
                                        primary_attraction_image: artistImage,
                                        venue_img_url: venueImage,
                                    });
                                    window.open(ticketCubeUrl, '_blank');
                                }}
                                className="bg-purple-500/90 hover:bg-purple-600 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                                title="Get Your TCUBE"
                            >
                                <ExternalLink className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Video Modal */}
            <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                <DialogContent className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-black border-4 border-white text-white -2xl shadow-1xl p-0">
                    <DialogClose asChild>
                        <button
                            className="absolute right-4 top-4 z-50 rounded-full bg-black/50 backdrop-blur-sm p-2 text-white hover:bg-black/70 transition-all duration-200 hover:scale-110"
                            onClick={() => setIsVideoModalOpen(false)}
                        >
                            <X className="h-6 w-6 font-bold stroke-[3]" />
                            <span className="sr-only">Close</span>
                        </button>
                    </DialogClose>

                    <div className="w-full aspect-video relative">                        {hasVideo && (
                            <ArtistVideoPlayer
                                artist={artistForPlayer}
                                isEmbed={true}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
