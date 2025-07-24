import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Calendar, MapPin, RefreshCw } from "lucide-react";
import { tourService } from "@/services/tourService";
import { ticketmasterService } from "@/services/ticketmasterService";
import { eventCacheService } from "@/services/eventCacheService";
import Image from "next/image";
import type { ArtistWithEvents, TicketmasterEvent } from "@/types/tour";

export default function OnTourPage() {
  const [artists, setArtists] = useState<ArtistWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ totalEvents: number; activeArtists: number; lastUpdated: string | null } | null>(null);
  const [testResults, setTestResults] = useState<string | null>(null);

  useEffect(() => {
    loadArtists();
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await tourService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    }
  };

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const artistsData = await tourService.getArtistsWithTmids();
      setArtists(artistsData);
    } catch (err) {
      console.error("Error loading artists:", err);
      setError("Failed to load artists. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshEventCache = async () => {
    try {
      setRefreshing(true);
      await tourService.refreshEventCache();
      await loadArtists();
      await loadCacheStats();
    } catch (error) {
      console.error("Error refreshing cache:", error);
      setError("Failed to refresh event cache. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const testSingleArtist = async () => {
    try {
      setRefreshing(true);
      // Test with the first artist that has a tmid
      const testArtist = artists.find(a => a.tmid);
      if (testArtist) {
        console.log(`Testing API with artist: ${testArtist.artist_name} (TMID: ${testArtist.tmid})`);
        await eventCacheService.refreshEventsForArtist(testArtist.artist_uuid, testArtist.tmid);
        await loadArtists();
        await loadCacheStats();
      }
    } catch (error) {
      console.error("Error testing single artist:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const testApiDirectly = async () => {
    try {
      setRefreshing(true);
      setTestResults("Testing API...");
      
      // Test with a known artist - let's use the first one from our database
      const testTmid = "2503872"; // "August 8" from our database query
      
      console.log(`Testing Ticketmaster API directly with TMID: ${testTmid}`);
      setTestResults(`Testing with TMID: ${testTmid}...`);
      
      // Call our API endpoint directly
      const response = await fetch(`/api/ticketmaster/events?attractionId=${testTmid}&size=5`);
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (response.ok) {
        const eventCount = data.events?.length || 0;
        const totalElements = data.totalElements || 0;
        
        setTestResults(`✅ API Test Successful!
        
Response Status: ${response.status}
Events Found: ${eventCount}
Total Available: ${totalElements}
        
${eventCount > 0 ? `First Event: ${data.events[0]?.name || 'N/A'}` : 'No events found for this artist'}

Raw Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResults(`❌ API Test Failed!
        
Status: ${response.status}
Error: ${data.message || 'Unknown error'}

Raw Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error("Direct API test error:", error);
      setTestResults(`❌ API Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  const StatusIndicator = ({ hasEvents }: { hasEvents: boolean }) => (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          hasEvents ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-sm font-medium">
        {hasEvents ? "On Sale" : "No Shows"}
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Artists On Tour</h1>
          <p className="text-muted-foreground">
            Testing Ticketmaster API integration - checking which artists have upcoming shows
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Artists On Tour</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadArtists} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Artists On Tour</h1>
        <p className="text-muted-foreground mb-4">
          Testing Ticketmaster API integration - checking which artists have upcoming shows
        </p>
        
        {/* Cache Stats */}
        {cacheStats && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Cache Status:</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Events:</span>
                <div className="font-semibold">{cacheStats.totalEvents}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Artists with Events:</span>
                <div className="font-semibold">{cacheStats.activeArtists}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <div className="font-semibold">
                  {cacheStats.lastUpdated ? new Date(cacheStats.lastUpdated).toLocaleString() : "Never"}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Tickets Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>No Upcoming Shows</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button onClick={testApiDirectly} disabled={refreshing} variant="default">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            🧪 Test API Directly
          </Button>
          <Button onClick={testSingleArtist} disabled={refreshing || artists.length === 0} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Test Single Artist
          </Button>
          <Button onClick={refreshEventCache} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh All Events {refreshing && "(This may take a few minutes)"}
          </Button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">API Test Results:</h3>
            <pre className="text-sm whitespace-pre-wrap font-mono bg-background p-3 rounded border overflow-x-auto">
              {testResults}
            </pre>
          </div>
        )}
      </div>

      {artists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No artists with Ticketmaster IDs found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Card key={artist.artist_uuid} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {artist.artist_image ? (
                    <Image
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {artist.artist_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{artist.artist_name}</CardTitle>
                    <StatusIndicator hasEvents={artist.hasEvents} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {artist.hasEvents && artist.events.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Upcoming Shows:</h4>
                    {artist.events.slice(0, 3).map((event: TicketmasterEvent) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">
                              {event.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="w-3 h-3" />
                              {ticketmasterService.formatEventDate(event)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {ticketmasterService.getEventVenue(event)}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(event.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Buy Tickets
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No upcoming shows found
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      TMID: {artist.tmid}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Button onClick={loadArtists} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
