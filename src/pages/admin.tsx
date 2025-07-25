import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Database, RefreshCw, Calendar, Users } from "lucide-react";
import { eventCacheService } from "@/services/eventCacheService";

// Mock admin check - in a real app, this would involve a secure check
const checkAdminAccess = async (email: string): Promise<boolean> => {
  // Allow specific admin emails
  const adminEmails = ["admin@otw.com", "alan@alanrakov.com"];
  return adminEmails.includes(email.toLowerCase());
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalEvents: 0, activeArtists: 0, lastUpdated: null as string | null });
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you might check a token from localStorage here
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const eventStats = await eventCacheService.getEventStats();
      setStats(eventStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const adminStatus = await checkAdminAccess(email);
    setIsAdmin(adminStatus);
    setLoading(false);
    if (!adminStatus) {
      alert("Access Denied. Please check the email and try again.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
          <Button onClick={handleVerify} className="w-full">
            Verify Access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome, Admin! Manage event cache and system operations.</p>
      
      {/* Event Cache Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Event Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <RefreshCw className="w-4 h-4 text-purple-500" />
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
