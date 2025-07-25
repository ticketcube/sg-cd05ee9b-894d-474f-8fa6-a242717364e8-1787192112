
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "@/services/eventCacheService";
import type { TicketmasterEvent } from "@/types/tour";
import { ExternalLink, Calendar, MapPin, Loader2, Database, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Artist = Tables<"artists">;

interface ApiResponse {
  events?: TicketmasterEvent[];
  totalElements?: number;
  message?: string;
}

export default function OnTourPage() {
  const [artistName, setArtistName] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [cachedEvents, setCachedEvents] = useState<TicketmasterEvent[]>([]);
  const [searching, setSearching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [caching, setCaching] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const searchArtist = async () => {
    if (!artistName.trim()) {
      setError("Please enter an artist name");
      return;
    }

    setSearching(true);
    setError(null);
    setSelectedArtist(null);
    setEvents([]);
    setCachedEvents([]);
    setApiResponse(null);

    try {
      const { data, error: dbError } = await supabase
        .from("artists")
        .select("*")
        .ilike("artist_name", `%${artistName.trim()}%`)
        .limit(1)
        .single();

      if (dbError) {
        if (dbError.code === "PGRST116") {
          throw new Error(`No artist found with name "${artistName}" in our database.`);
        }
        throw dbError;
      }
      
      setSelectedArtist(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search for artist";
      console.error("Error searching for artist:", errorMessage);
      setError(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const testTicketmasterAPI = async () => {
    if (!selectedArtist?.artist_name) return;
    setTesting(true);
    setError(null);
    setApiResponse(null);
    try {
      const response = await fetch(`/api/ticketmaster/events?keyword=${encodeURIComponent(selectedArtist.artist_name)}`);
      const data: ApiResponse = await response.json();
      
      setApiResponse(data);
      if (!response.ok) throw new Error(data.message || `API Error: ${response.status}`);
      
      const fetchedEvents = data.events || [];
      setEvents(fetchedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to test Ticketmaster API";
      console.error("Error testing API:", errorMessage);
      setError(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const cacheEventsToDatabase = async () => {
    if (!selectedArtist?.uuid || !selectedArtist?.attractionId) {
        setError("This artist does not have a Ticketmaster AttractionID, so caching is disabled.");
        return;
    }
    setCaching(true);
    setError(null);
    try {
      await eventCacheService.refreshEventsForArtist(selectedArtist.uuid, selectedArtist.attractionId);
      await loadCachedEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cache events";
      console.error("Error caching events:", errorMessage);
      setError(errorMessage);
    } finally {
      setCaching(false);
    }
  };

  const loadCachedEvents = async () => {
    if (!selectedArtist?.uuid) return;
    setLoadingCache(true);
    setError(null);
    try {
      const cached = await eventCacheService.getCachedEventsForArtist(selectedArtist.uuid);
      setCachedEvents(cached);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load cached events";
      console.error("Error loading cached events:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingCache(false);
    }
  };

  const EventCard = ({ event, type }: { event: TicketmasterEvent; type: "api" | "cached" }) => {
    const venue = event._embedded?.venues?.[0];
    const date = new Date(event.dates.start.localDate).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <div className={`border rounded-lg p-4 ${type === 'cached' ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-lg">{event.name}</h4>
          <Badge variant={type === 'cached' ? 'secondary' : 'outline'}>
            {type === 'cached' ? 'Cached' : 'Live API'}
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
            {event.dates.start.localTime && <span>at {event.dates.start.localTime}</span>}
          </div>
          {venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{`${venue.name}, ${venue.city.name}`}</span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Buy Tickets
          </a>
        </Button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">On Tour Lookup</h1>
        <p className="text-muted-foreground">
          Enter an artist name to find their upcoming tour dates using the Ticketmaster API.
        </p>
      </header>

      {error && (
        <Card className="mb-6 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔍 Artist Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter artist name (e.g., Dua Lipa)"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchArtist()}
              className="flex-1"
            />
            <Button onClick={searchArtist} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>

          {selectedArtist && (
            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-4 mb-4">
                {selectedArtist.artist_image && (
                  <Image
                    src={selectedArtist.artist_image}
                    alt={selectedArtist.artist_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{selectedArtist.artist_name}</h3>
                  <p className="text-sm text-muted-foreground">Genre: {selectedArtist.artist_genre}</p>
                   {selectedArtist.attractionId && <p className="text-xs text-muted-foreground">AttractionID: {selectedArtist.attractionId}</p>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={testTicketmasterAPI} disabled={testing}>
                  {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "🧪"} Test API
                </Button>
                <Button onClick={cacheEventsToDatabase} disabled={caching || !selectedArtist.attractionId} variant="secondary">
                  {caching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  Cache Events
                </Button>
                <Button onClick={loadCachedEvents} disabled={loadingCache} variant="secondary">
                  {loadingCache ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Load Cached
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {apiResponse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🎫 Live API Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testing ? (
              <p>Testing API...</p>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Found {apiResponse.totalElements} total events</p>
                {events.map(event => <EventCard key={event.id} event={event} type="api" />)}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming events found via API.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedArtist && (
        <Card>
          <CardHeader>
            <CardTitle>💾 Cached Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCache ? (
              <p>Loading cached events...</p>
            ) : cachedEvents.length > 0 ? (
              <div className="space-y-4">
                {cachedEvents.map(event => <EventCard key={event.id} event={event} type="cached" />)}
              </div>
            ) : (
              <p className="text-muted-foreground">No events found in cache. Try caching them first.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
