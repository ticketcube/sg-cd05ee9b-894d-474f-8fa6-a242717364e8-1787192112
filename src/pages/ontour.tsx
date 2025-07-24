import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ticketmasterService } from "@/services/ticketmasterService";
import { eventCacheService } from "@/services/eventCacheService";
import type { TicketmasterEvent } from "@/types/tour";
import { ExternalLink, Calendar, MapPin, Loader2, Database } from "lucide-react";

interface TestArtist {
  UUID: string;
  artist_name: string;
  artist_image: string | null;
  tmid: string;
}

export default function OnTourPage() {
  const [testArtist, setTestArtist] = useState<TestArtist | null>(null);
  const [events, setEvents] = useState<TicketmasterEvent[]>([]);
  const [cachedEvents, setCachedEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [caching, setCaching] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Load a test artist on component mount
  useEffect(() => {
    loadTestArtist();
  }, []);

  const loadTestArtist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Loading Ashe for testing...");
      
      // Specifically load Ashe for testing
      const { data, error: dbError } = await supabase
        .from("artists")
        .select("UUID, artist_name, artist_image, tmid")
        .eq("artist_name", "Ashe")
        .not("artist_image", "eq", "null")
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        setError(`Database error: ${dbError.message}`);
        return;
      }

      if (!data) {
        setError("Ashe not found in database");
        return;
      }

      const artist = data as TestArtist;
      console.log("Loaded Ashe:", artist);
      setTestArtist(artist);
      
    } catch (err) {
      console.error("Error loading Ashe:", err);
      setError("Failed to load Ashe");
    } finally {
      setLoading(false);
    }
  };

  const testTicketmasterAPI = async () => {
    if (!testArtist) return;

    try {
      setTesting(true);
      setError(null);
      setEvents([]);
      setApiResponse(null);

      console.log(`Testing Ticketmaster API for ${testArtist.artist_name} (TMID: ${testArtist.tmid})`);

      // Test the API directly
      const response = await fetch(`/api/ticketmaster/events?attractionId=${testArtist.tmid}&size=5`);
      const data = await response.json();
      
      console.log("API Response:", data);
      setApiResponse(data);

      if (!response.ok) {
        setError(`API Error: ${data.message || response.statusText}`);
        return;
      }

      const fetchedEvents = data.events || [];
      setEvents(fetchedEvents);
      
      console.log(`Found ${fetchedEvents.length} events for ${testArtist.artist_name}`);

    } catch (err) {
      console.error("Error testing API:", err);
      setError("Failed to test Ticketmaster API");
    } finally {
      setTesting(false);
    }
  };

  const cacheEventsToDatabase = async () => {
    if (!testArtist) return;

    try {
      setCaching(true);
      setError(null);

      console.log(`Caching events for ${testArtist.artist_name} to database...`);

      // Use the eventCacheService to refresh events for this artist
      await eventCacheService.refreshEventsForArtist(testArtist.UUID, testArtist.tmid);
      
      console.log(`Successfully cached events for ${testArtist.artist_name}`);

    } catch (err) {
      console.error("Error caching events:", err);
      setError("Failed to cache events to database");
    } finally {
      setCaching(false);
    }
  };

  const loadCachedEvents = async () => {
    if (!testArtist) return;

    try {
      setLoadingCache(true);
      setError(null);
      setCachedEvents([]);

      console.log(`Loading cached events for ${testArtist.artist_name}...`);

      // Get cached events from database
      const cached = await eventCacheService.getCachedEventsForArtist(testArtist.UUID);
      setCachedEvents(cached);
      
      console.log(`Loaded ${cached.length} cached events for ${testArtist.artist_name}`);

    } catch (err) {
      console.error("Error loading cached events:", err);
      setError("Failed to load cached events");
    } finally {
      setLoadingCache(false);
    }
  };

  const formatEventDate = (event: TicketmasterEvent): string => {
    const date = new Date(event.dates.start.localDate);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getEventVenue = (event: TicketmasterEvent): string => {
    const venue = event._embedded?.venues?.[0];
    if (!venue) return "Venue TBA";
    
    const city = venue.city.name;
    const state = venue.state?.name;
    const country = venue.country.name;
    
    if (state) {
      return `${venue.name}, ${city}, ${state}`;
    } else {
      return `${venue.name}, ${city}, ${country}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Ticketmaster API Test - Ashe</h1>
        <p className="text-muted-foreground">
          Testing complete flow: API → Database → Display with Ashe
        </p>
      </div>

      {/* Test Artist Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎤 Ashe Test
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading test artist...</p>
            </div>
          ) : testArtist ? (
            <div className="flex items-center gap-4 mb-4">
              {testArtist.artist_image && (
                <img 
                  src={testArtist.artist_image} 
                  alt={testArtist.artist_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold">{testArtist.artist_name}</h3>
                <p className="text-sm text-muted-foreground">TMID: {testArtist.tmid}</p>
                <p className="text-sm text-muted-foreground">UUID: {testArtist.UUID}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-500">
              {error || "No test artist loaded"}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={loadTestArtist} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Load Ashe
            </Button>
            <Button 
              onClick={testTicketmasterAPI} 
              disabled={!testArtist || testing}
              variant="outline"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              🧪 Test API
            </Button>
            <Button 
              onClick={cacheEventsToDatabase} 
              disabled={!testArtist || caching}
              variant="secondary"
            >
              {caching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Cache Events
            </Button>
            <Button 
              onClick={loadCachedEvents} 
              disabled={!testArtist || loadingCache}
              variant="secondary"
            >
              {loadingCache ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Load Cached
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Response Section */}
      {apiResponse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge variant={events.length > 0 ? "default" : "secondary"}>
                {events.length > 0 ? "✅ Events Found" : "❌ No Events"}
              </Badge>
              <span className="ml-2 text-sm text-muted-foreground">
                Total: {apiResponse.totalElements || 0} events
              </span>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-red-700 font-medium">Error:</p>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Raw API Response
              </summary>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Events Section */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎫 Upcoming Events
              <Badge>{events.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{event.name}</h4>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatEventDate(event)}
                      {event.dates.start.localTime && (
                        <span className="ml-1">at {event.dates.start.localTime}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {getEventVenue(event)}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(event.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buy Tickets
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cached Events Section */}
      {cachedEvents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💾 Cached Events from Database
              <Badge variant="secondary">{cachedEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cachedEvents.map((event, index) => (
                <div key={event.id} className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{event.name}</h4>
                    <Badge variant="outline">Cached #{index + 1}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatEventDate(event)}
                      {event.dates.start.localTime && (
                        <span className="ml-1">at {event.dates.start.localTime}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {getEventVenue(event)}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(event.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buy Tickets
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔧 Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Test Artist Loaded:</strong> {testArtist ? "✅ Yes" : "❌ No"}</p>
            <p><strong>API Tested:</strong> {apiResponse ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Events Found:</strong> {events.length}</p>
            <p><strong>Events Cached:</strong> {caching ? "⏳ Caching..." : "Ready"}</p>
            <p><strong>Cached Events Loaded:</strong> {cachedEvents.length}</p>
            <p><strong>Current Error:</strong> {error || "None"}</p>
            <p><strong>Loading State:</strong> {loading ? "Loading..." : "Ready"}</p>
            <p><strong>Testing State:</strong> {testing ? "Testing..." : "Ready"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
