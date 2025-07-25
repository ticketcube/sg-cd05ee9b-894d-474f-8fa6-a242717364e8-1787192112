import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, ExternalLink, X } from "lucide-react";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";
import Image from "next/image";

interface ArtistShowsPopupProps {
  artist: ArtistWithEvents | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArtistShowsPopup({ artist, isOpen, onClose }: ArtistShowsPopupProps) {
  if (!artist) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCityName = (event: TicketmasterEvent) => {
    const venue = event._embedded?.venues?.[0];
    const cityName = venue?.city?.name || "Unknown City";
    const stateName = venue?.state?.name;
    
    if (stateName) {
      return `${cityName}, ${stateName}`;
    }
    return cityName;
  };

  // Filter events to only show those with valid URLs (public shows on sale)
  const publicEvents = artist.events.filter(event => 
    event.url && event.url !== "#" && event.url.trim() !== ""
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {artist.artist_name} - Upcoming Shows
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Artist Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {artist.artist_image && (
              <Image
                src={artist.artist_image}
                alt={artist.artist_name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">{artist.artist_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {artist.vote_count && artist.vote_count > 0 && (
                  <Badge variant="secondary">{artist.vote_count} votes</Badge>
                )}
                {artist.rank && artist.rank > 0 && (
                  <Badge variant="outline">Rank #{artist.rank}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {publicEvents.length > 0 ? (
              <>
                <h4 className="font-semibold text-lg">
                  {publicEvents.length} Public Show{publicEvents.length !== 1 ? 's' : ''} On Sale
                </h4>
                
                {publicEvents.map((event) => {
                  const venue = event._embedded?.venues?.[0];
                  const cityName = getCityName(event);
                  
                  return (
                    <div key={event.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-semibold text-base">{event.name}</h5>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.dates.start.localDate)}</span>
                              {event.dates.start.localTime && (
                                <span>at {event.dates.start.localTime}</span>
                              )}
                            </div>
                            {venue && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{venue.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* City-based ticket button */}
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        asChild
                      >
                        <a 
                          href={event.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {cityName}
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8">
                <h4 className="font-semibold text-lg mb-2">No Public Shows Available</h4>
                <p className="text-muted-foreground">
                  {artist.events.length > 0 
                    ? `${artist.events.length} private/industry events found, but no public shows are currently on sale.`
                    : "No upcoming events found for this artist."
                  }
                </p>
              </div>
            )}
          </div>

          {/* Show total events count if there are private events */}
          {artist.events.length > publicEvents.length && (
            <div className="text-center text-sm text-muted-foreground border-t pt-3">
              <p>
                Showing {publicEvents.length} public shows out of {artist.events.length} total events
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
