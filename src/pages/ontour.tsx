import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { eventCacheService } from "@/services/eventCacheService";
import type { TicketmasterEvent } from "@/types/tour";
import { ExternalLink, Calendar, MapPin, Loader2, Database, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Artist = Tables<"artists">;

interface ApiResponse {
  events?: TicketmasterEvent[];
  totalElements?: number;
  message?: string;
}

export default function OnTourPage() {
  const [testArtist, setTestArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [cachedEvents, setCachedEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [caching, setCaching] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    loadTestArtist();
  }, []);

  const loadTestArtist = async () => {
    setLoading(true);a
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("artists")
        .select("*")
        .eq("attractionId", "2783377")
        .single();

      if (dbError) throw dbError;
      if (!data) throw new Error("Artist with attractionID 2783377 not found.");
      
      setTestArtist(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load test artist";
      console.error("Error loading test artist:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testTicketmasterAPI = async () => {
    if (!testArtist?.attractionId) return;
    setTesting(true);
    setError(null);
    setApiResponse(null);
    try {
      const response = await fetch(`/api/ticketmaster/events?attractionId=${testArtist.attractionId}&size=5`);
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
    if (!testArtist?.uuid || !testArtist?.attractionId) return;
    setCaching(true);
    setError(null);
    try {
      await eventCacheService.refreshEventsForArtist(testArtist.uuid, testArtist.attractionId);
      await loadCachedEvents(); // Refresh cached events view
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cache events";
      console.error("Error caching events:", errorMessage);
      setError(errorMessage);
    } finally {
      setCaching(false);
    }
  };

  const loadCachedEvents = async () => {
    if (!testArtist?.uuid) return;
    setLoadingCache(true);
    setError(null);
    try {
      const cached = await eventCacheService.getCachedEventsForArtist(testArtist.uuid);
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
      <div className={`border rounded-lg p-4 ${type === 'cached' ? 'bg-blue-50' : ''}`}>
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
        <h1 className="text-4xl font-bold mb-2">Ticketmaster Integration Test</h1>
        <p className="text-muted-foreground">
          Testing API connection, database caching, and event display for a single artist.
        </p>
      </header>

      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              🎤 Test Artist
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            <Button variant="ghost" size="icon" onClick={loadTestArtist} disabled={loading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testArtist ? (
            <div className="flex items-center gap-4 mb-4">
              {testArtist.artist_image && (
                <Image
                  src={testArtist.artist_image}
                  alt={testArtist.artist_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold">{testArtist.artist_name}</h3>
                <p className="text-sm text-muted-foreground">: {testArtist.attractionId}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading artist details...</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={testTicketmasterAPI} disabled={!testArtist || testing}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "🧪"} Test API
            </Button>
            <Button onClick={cacheEventsToDatabase} disabled={!testArtist || caching} variant="secondary">
              {caching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Cache Events
            </Button>
            <Button onClick={loadCachedEvents} disabled={!testArtist || loadingCache} variant="secondary">
              {loadingCache ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Load Cached
            </Button>
          </div>
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
                {events.map(event => <EventCard key={event.id} event={event} type="api" />)}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming events found via API.</p>
            )}
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
