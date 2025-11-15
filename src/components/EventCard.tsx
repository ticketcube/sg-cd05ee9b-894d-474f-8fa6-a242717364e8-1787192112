import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ExternalLink, MapPin, Clock, Ticket } from "lucide-react";

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
    };
}

export function EventCard({ event }: EventCardProps) {
    const [showTicketOptions, setShowTicketOptions] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return "Time TBA";
        const [hours, minutes] = timeStr.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-black">
            <CardContent className="p-4">
                {/* Event Name */}
                <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900">
                    {event.event_name}
                </h3>

                {/* Event Details Grid */}
                <div className="space-y-2 mb-4">
                    {/* Venue */}
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">{event.venue_name}</p>
                            <p className="text-gray-600">
                                {event.venue_city}
                                {event.venue_state && `, ${event.venue_state}`}
                            </p>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{formatTime(event.event_time)}</span>
                        </div>
                    </div>
                </div>

                {/* Ticket Actions */}
                {!showTicketOptions ? (
                    <Button
                        onClick={() => setShowTicketOptions(true)}
                        className="w-full bg-black hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                        <Ticket className="w-4 h-4" />
                        Get Tickets
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <Button
                            asChild
                            className="w-full bg-black hover:bg-gray-800 flex items-center justify-center gap-2"
                        >
                            <a href={event.event_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                Buy on Ticketmaster
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-gray-300"
                            disabled
                        >
                            <Calendar className="w-4 h-4" />
                            OTW Live WillCall
                            <span className="text-xs text-gray-500 ml-1">(Coming Soon)</span>
                        </Button>
                        <button
                            onClick={() => setShowTicketOptions(false)}
                            className="w-full text-sm text-gray-600 hover:text-gray-900 py-1"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}