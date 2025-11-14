import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestTMApi() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [bulkRefreshRunning, setBulkRefreshRunning] = useState(false);
  const [artistName, setArtistName] = useState("Laufey");
  const [updateLimit, setUpdateLimit] = useState("10");

  const testSingleArtist = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/test-tm-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testArtistUuid: "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c" })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const testMultipleArtists = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/test-tm-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const runFullBulkRefresh = async () => {
    if (!confirm("This will refresh events for ALL 492 artists with a 6-month lookahead. This will take ~2 minutes. Continue?")) {
      return;
    }

    setBulkRefreshRunning(true);
    try {
      const response = await fetch("/api/admin/refresh-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setBulkRefreshRunning(false);
    }
  };

  const findAttractionId = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ticketmaster/find-attraction?artistName=${encodeURIComponent(artistName)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const updateAttractionIds = async (testMode: boolean) => {
    const limit = parseInt(updateLimit);
    
    if (!testMode && !confirm(`This will UPDATE attractionIds for ${limit} artists in your database. Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/update-attraction-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit, testMode })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Ticketmaster API Admin Tools</h1>

      <Tabs defaultValue="attraction-ids" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attraction-ids">1. Find attractionIds</TabsTrigger>
          <TabsTrigger value="refresh-events">2. Refresh Events</TabsTrigger>
        </TabsList>

        <TabsContent value="attraction-ids" className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">Step 1: Find & Update attractionIds</h3>
            <p className="text-sm text-gray-700">
              <strong>Problem:</strong> Many artists have wrong attractionIds (e.g., 347aidan has Dua Lipa's ID)<br/>
              <strong>Solution:</strong> Search TM by artist name → Get correct attractionId → Update database
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Single Artist Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Artist name..."
                  className="flex-1"
                />
                <Button onClick={findAttractionId} disabled={loading}>
                  {loading ? "Searching..." : "Find attractionId"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Update attractionIds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={updateLimit}
                  onChange={(e) => setUpdateLimit(e.target.value)}
                  placeholder="Number of artists..."
                  className="w-32"
                />
                <Button 
                  onClick={() => updateAttractionIds(true)} 
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? "Testing..." : "Test Mode (Preview)"}
                </Button>
                <Button 
                  onClick={() => updateAttractionIds(false)} 
                  disabled={loading}
                  variant="destructive"
                >
                  {loading ? "Updating..." : "Update Database"}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Test Mode:</strong> Shows what would change without updating database<br/>
                <strong>Update Database:</strong> Actually updates the attractionIds<br/>
                <strong>Rate Limit:</strong> 250ms delay (4 req/sec) • Est: {Math.ceil(parseInt(updateLimit) / 4)} seconds
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refresh-events" className="space-y-4">
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold mb-2">Step 2: Refresh Events (After attractionIds are correct)</h3>
            <p className="text-sm text-gray-700">
              <strong>Date Range:</strong> Today → 6 months (Nov 14, 2025 - May 14, 2026)<br/>
              <strong>Artists:</strong> 492 with attractionIds<br/>
              <strong>Est. Runtime:</strong> ~2 minutes
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={testSingleArtist} disabled={loading || bulkRefreshRunning}>
              {loading ? "Testing..." : "Test Single Artist (Laufey)"}
            </Button>

            <Button onClick={testMultipleArtists} disabled={loading || bulkRefreshRunning} variant="secondary">
              {loading ? "Testing..." : "Test 5 Artists"}
            </Button>

            <Button 
              onClick={runFullBulkRefresh} 
              disabled={loading || bulkRefreshRunning} 
              variant="destructive"
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkRefreshRunning ? "Running... (~2 min)" : "⚡ Full Bulk Refresh (492 Artists)"}
            </Button>
          </div>

          {bulkRefreshRunning && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                🔄 <strong>Bulk refresh in progress...</strong><br/>
                Processing 492 artists with 250ms delays.<br/>
                This will take approximately 2 minutes. Please wait...
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>

            {results.summary && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-bold mb-2">Summary:</h3>
                <ul className="space-y-1 text-sm">
                  {Object.entries(results.summary).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
