import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Database, RefreshCw, Calendar, Users, ListPlus, UserPlus, Search } from "lucide-react";
import { withAdminGuard } from "@/components/guards/withAdminGuard";
import { eventCacheService } from "@/services/eventCacheService";
import { weeklyListService } from "@/services/weeklyListService";
import { adminArtistService, Artist } from "@/services/adminArtistService";

function AdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalEvents: 0, activeArtists: 0, lastUpdated: null as string | null });
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [listCreationResult, setListCreationResult] = useState<string | null>(null);

  // Artist management state
  const [artistName, setArtistName] = useState("");
  const [artistVideoLink, setArtistVideoLink] = useState("");
  const [artistImage, setArtistImage] = useState("");
  const [addingArtist, setAddingArtist] = useState(false);
  const [artistResult, setArtistResult] = useState<string | null>(null);
  const [existingArtist, setExistingArtist] = useState<Artist | null>(null);

  // API Stats
  const [apiStats, setApiStats] = useState({ totalUsers: 0, totalEngagements: 0 });
  const [loadingApiStats, setLoadingApiStats] = useState(false);

  useEffect(() => {
    loadStats();
    loadApiStats();
  }, []);

  const loadStats = async () => {
    try {
      const eventStats = await eventCacheService.getEventStats();
      setStats(eventStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadApiStats = async () => {
    setLoadingApiStats(true);
    try {
      const response = await fetch("/api/admin/protected", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setApiStats(data.stats);
        }
      } else {
        console.error("Failed to load API stats:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading API stats:", error);
    } finally {
      setLoadingApiStats(false);
    }
  };

  const testAdminApi = async () => {
    setLoadingApiStats(true);
    try {
      const response = await fetch("/api/admin/protected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "admin_test"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Admin API Test Successful!\n\nUser ID: ${data.user_id}\nRole: ${data.role}\nMessage: ${data.message}`);
      } else {
        const errorData = await response.json();
        alert(`❌ Admin API Test Failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error testing admin API:", error);
      alert(`❌ Admin API Test Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoadingApiStats(false);
    }
  };

  const handleRefreshAllEvents = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    
    try {
      // Set a longer timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      const response = await fetch("/api/admin/refresh-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRefreshResult(`✅ Success! Refreshed events for all artists. Found ${data.stats.totalEvents} total events across ${data.stats.activeArtists} artists.`);
        await loadStats(); // Reload stats
      } else {
        setRefreshResult(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error refreshing events:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        setRefreshResult(`❌ Error: Request timed out after 5 minutes. The process may still be running in the background.`);
      } else {
        setRefreshResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSampleList = async () => {
    setCreatingList(true);
    setListCreationResult(null);
    try {
      const list = await weeklyListService.createSampleWeeklyList();
      setListCreationResult(`✅ Success! Created sample list "${list.title}" with ID ${list.week_identifier}.`);
    } catch (error) {
      console.error("Error creating sample list:", error);
      setListCreationResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setCreatingList(false);
    }
  };

  const handleCheckArtist = async () => {
    if (!artistName.trim()) {
      setArtistResult("❌ Please enter an artist name.");
      return;
    }

    setAddingArtist(true);
    setArtistResult(null);
    setExistingArtist(null);

    try {
      const existing = await adminArtistService.checkArtistExists(artistName);
      if (existing) {
        setExistingArtist(existing);
        setArtistResult(`🔍 Artist "${existing.artist_name}" already exists in the database.`);
      } else {
        setArtistResult(`✅ Artist "${artistName}" is not in the database. Ready to add!`);
      }
    } catch (error) {
      console.error("Error checking artist:", error);
      setArtistResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setAddingArtist(false);
    }
  };

  const handleAddArtist = async () => {
    if (!artistName.trim()) {
      setArtistResult("❌ Please enter an artist name.");
      return;
    }

    setAddingArtist(true);
    setArtistResult(null);

    try {
      const newArtist = await adminArtistService.addArtist({
        artist_name: artistName,
        artist_videolink: artistVideoLink || undefined,
        artist_image: artistImage || undefined
      });

      setArtistResult(`✅ Success! Added "${newArtist.artist_name}" to the database with ID ${newArtist.uuid}.`);
      
      // Clear the form
      setArtistName("");
      setArtistVideoLink("");
      setArtistImage("");
      setExistingArtist(null);

      // Reload stats to reflect the new artist count
      await loadStats();
    } catch (error) {
      console.error("Error adding artist:", error);
      setArtistResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setAddingArtist(false);
    }
  };

  const clearArtistForm = () => {
    setArtistName("");
    setArtistVideoLink("");
    setArtistImage("");
    setArtistResult(null);
    setExistingArtist(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔒 OTW Staff Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome to the admin control panel! Manage events, artists, and system operations.</p>

      {/* API Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Events</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Active Artists</span>
              </div>
              <div className="text-2xl font-bold">{stats.activeArtists}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <div className="text-2xl font-bold">
                {loadingApiStats ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  apiStats.totalUsers
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Last Updated</span>
              </div>
              <div className="text-sm">
                {stats.lastUpdated 
                  ? new Date(stats.lastUpdated).toLocaleString()
                  : "Never"
                }
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={loadApiStats}
              disabled={loadingApiStats}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loadingApiStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Stats
            </Button>
            
            <Button 
              onClick={testAdminApi}
              disabled={loadingApiStats}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loadingApiStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Test Admin API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Cache Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Event Cache Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleRefreshAllEvents}
              disabled={refreshing}
              className="flex items-center gap-2"
              size="lg"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {refreshing ? "Refreshing All Events..." : "Refresh All Artist Events"}
            </Button>
            
            <Button 
              onClick={loadStats}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <Database className="w-4 h-4" />
              Reload Stats
            </Button>
          </div>
          
          {refreshing && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🔄 Processing all artists in the database... This may take several minutes due to API rate limiting (500ms delay between requests).
              </p>
            </div>
          )}
          
          {refreshResult && (
            <div className={`p-4 rounded-lg ${
              refreshResult.startsWith('✅') 
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}>
              <p className="text-sm">{refreshResult}</p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Note:</strong> The refresh process will:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fetch all artists from the database</li>
              <li>Call Ticketmaster API for each artist using their name as keyword</li>
              <li>Filter and cache only events with valid public ticket URLs</li>
              <li>Include rate limiting to avoid API restrictions</li>
              <li>Update the tour page with fresh data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Weekly List Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Weekly List Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a sample weekly list for testing purposes. This will create a list for "2025-W30" and add the artist Laufey to it.
          </p>
          <Button
            onClick={handleCreateSampleList}
            disabled={creatingList}
            className="flex items-center gap-2"
          >
            {creatingList ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ListPlus className="w-4 h-4" />
            )}
            {creatingList ? "Creating List..." : "Create Sample Weekly List"}
          </Button>
          {listCreationResult && (
            <div className={`p-4 rounded-lg ${
              listCreationResult.startsWith('✅') 
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}>
              <p className="text-sm">{listCreationResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artist Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Artist Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add new artists to the database. The system will check if the artist already exists before adding.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Artist Name *</label>
                <Input
                  type="text"
                  placeholder="Enter artist name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckArtist()}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Video Link</label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={artistVideoLink}
                  onChange={(e) => setArtistVideoLink(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Artist Image URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={artistImage}
                  onChange={(e) => setArtistImage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {artistImage && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Image Preview</label>
                  <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                    <img
                      src={artistImage}
                      alt="Artist preview"
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {existingArtist && (
                <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                  <h4 className="font-medium mb-2">Existing Artist Found:</h4>
                  <p className="text-sm"><strong>Name:</strong> {existingArtist.artist_name}</p>
                  <p className="text-sm"><strong>ID:</strong> {existingArtist.uuid}</p>
                  {existingArtist.artist_videolink && (
                    <p className="text-sm"><strong>Video:</strong> {existingArtist.artist_videolink}</p>
                  )}
                  {existingArtist.artist_image && (
                    <p className="text-sm"><strong>Image:</strong> {existingArtist.artist_image}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCheckArtist}
              disabled={addingArtist || !artistName.trim()}
              className="flex items-center gap-2"
              variant="outline"
            >
              {addingArtist ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Check if Artist Exists
            </Button>

            <Button
              onClick={handleAddArtist}
              disabled={addingArtist || !artistName.trim() || existingArtist !== null}
              className="flex items-center gap-2"
            >
              {addingArtist ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add New Artist
            </Button>

            <Button
              onClick={clearArtistForm}
              variant="outline"
              className="flex items-center gap-2"
            >
              Clear Form
            </Button>
          </div>

          {artistResult && (
            <div className={`p-4 rounded-lg ${
              artistResult.startsWith('✅') 
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                : artistResult.startsWith('🔍')
                ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}>
              <p className="text-sm">{artistResult}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Enter the artist name (required) and optional video link and image URL</li>
              <li>Click "Check if Artist Exists" to verify the artist isn't already in the database</li>
              <li>If the artist doesn't exist, click "Add New Artist" to create the entry</li>
              <li>The system performs case-insensitive duplicate checking</li>
              <li>All new artists are added with today's date as creation date</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.open('/ontour', '_blank')}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Manual Event Testing
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/tour', '_blank')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Tour Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export the page wrapped with the admin guard HOC
export default withAdminGuard(AdminPage);