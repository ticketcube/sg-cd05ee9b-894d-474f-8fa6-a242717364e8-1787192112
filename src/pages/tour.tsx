
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Calendar, Users } from "lucide-react";
import { eventCacheService } from "@/services/eventCacheService";
import { artistService } from "@/services/artistService";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";
import type { ArtistWithVoteCount } from "@/types/artists";
import Image from "next/image";
import ArtistShowsPopup from "@/components/ArtistShowsPopup";

export default function TourPage() {
  const [artists, setArtists] = useState<ArtistWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithEvents | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [stats, setStats] = useState({ totalEvents: 0, activeArtists: 0 });

  useEffect(() => {
    loadArtistsWithEvents();
    loadStats();
  }, []);

  const loadArtistsWithEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get top 100 artists first
      const { artists: top100Artists } = await artistService.getTop100ArtistsSortedByVotes(1, 100);
      
      if (!top100Artists || top100Artists.length === 0) {
        setError("No artists found");
        return;
      }

      const artistsWithEvents: ArtistWithEvents[] = [];
      
      // Check each artist for cached events
      for (const artist of top100Artists) {
        if (artist && artist.uuid && artist.artist_name) {
          try {
            const events: TicketmasterEvent[] = await eventCacheService.getCachedEventsForArtist(artist.uuid);
            
            // Only include artists that have events with valid URLs (public shows)
            const publicEvents = events.filter(event => 
              event.url && event.url !== "#" && event.url.trim() !== ""
            );
            
            if (publicEvents.length > 0) {
              artistsWithEvents.push({
                artist_uuid: artist.uuid,
                artist_name: artist.artist_name,
                artist_image: artist.artist_image,
                attractionId: artist.attractionId || null,
                hasEvents: true,
                events: publicEvents,
                vote_count: (artist as ArtistWithVoteCount).vote_count || 0,
                rank: (artist as ArtistWithVoteCount).rank || 0
              });
            }
          } catch (error) {
            console.warn(`Failed to get events for ${artist.artist_name}:`, error);
          }
        }
      }

      // Sort by number of public events, then by vote count
      artistsWithEvents.sort((a, b) => {
        const aPublicEvents = a.events.filter(e => e.url && e.url !== "#").length;
        const bPublicEvents = b.events.filter(e => e.url && e.url !== "#").length;
        
        if (aPublicEvents !== bPublicEvents) {
          return bPublicEvents - aPublicEvents;
        }
        
        return (b.vote_count || 0) - (a.vote_count || 0);
      });

      setArtists(artistsWithEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load artists with events";
      console.error("Error loading artists with events:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const eventStats = await eventCacheService.getEventStats();
      setStats(eventStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleViewShows = (artist: ArtistWithEvents) => {
    setSelectedArtist(artist);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedArtist(null);
  };

  const getPublicEventsCount = (events: TicketmasterEvent[]) => {
    return events.filter(event => event.url && event.url !== "#" && event.url.trim() !== "").length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Artists On Tour...</h1>
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Tour Data</h1>
          <p className="text-xl text-red-500">{error}</p>
          <Button 
            onClick={loadArtistsWithEvents} 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black z-10 p-3 sm:p-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-white hover:bg-gray-800 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Chart</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500 truncate">
                Artists On Tour
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                {artists.length} artists with upcoming shows
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{stats.totalEvents} total events</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{stats.activeArtists} active artists</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {artists.length > 0 ? (
            <div className="grid gap-4">
              {artists.map((artist) => {
                const publicEventsCount = getPublicEventsCount(artist.events);
                const nextEvent = artist.events[0]; // Events are sorted by date
                const venue = nextEvent?._embedded?.venues?.[0];
                
                return (
                  <Card key={artist.artist_uuid} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Artist Image */}
                        {artist.artist_image && (
                          <Image
                            src={artist.artist_image}
                            alt={artist.artist_name}
                            width={80}
                            height={80}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        
                        {/* Artist Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                            {artist.artist_name}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {artist.vote_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {artist.vote_count} votes
                              </Badge>
                            )}
                            {artist.rank > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Rank #{artist.rank}
                              </Badge>
                            )}
                            <Badge variant="default" className="text-xs bg-green-600">
                              {publicEventsCount} show{publicEventsCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          {/* Next Show Info */}
                          {nextEvent && (
                            <div className="text-sm text-gray-400 mt-2">
                              <p className="truncate">
                                Next: {new Date(nextEvent.dates.start.localDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })}
                                {venue && ` • ${venue.city?.name || "Unknown City"}`}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* View Shows Button */}
                        <Button
                          onClick={() => handleViewShows(artist)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 flex-shrink-0"
                        >
                          VIEW SHOWS
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No Artists On Tour</h2>
              <p className="text-gray-400 mb-6">
                No artists currently have public shows available for purchase.
              </p>
              <Button 
                onClick={loadArtistsWithEvents}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Refresh Data
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Artist Shows Popup */}
      <ArtistShowsPopup 
        artist={selectedArtist}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </div>
  );
}
