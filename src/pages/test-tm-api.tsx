import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestTMApi() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [bulkRefreshRunning, setBulkRefreshRunning] = useState(false);

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

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Ticketmaster API Test</h1>

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-gray-700">
          <strong>Date Range:</strong> Today → 6 months from now (Nov 14, 2025 - May 14, 2026)<br/>
          <strong>Artists with attractionId:</strong> 492 artists<br/>
          <strong>Rate Limit:</strong> 250ms delay between requests (4 req/sec)<br/>
          <strong>Est. Runtime:</strong> ~2 minutes for full refresh
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
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
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">
            🔄 <strong>Bulk refresh in progress...</strong><br/>
            Processing 492 artists with 250ms delays between requests.<br/>
            This will take approximately 2 minutes. Please wait...
          </p>
        </div>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>

            {results.summary && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-bold mb-2">Summary:</h3>
                <ul className="space-y-1">
                  <li>Total Artists: {results.summary.totalArtists}</li>
                  {results.summary.artistsWithEvents !== undefined && (
                    <li>Artists with Events: {results.summary.artistsWithEvents}</li>
                  )}
                  {results.summary.totalEventsFound !== undefined && (
                    <li>Total Events Found: {results.summary.totalEventsFound}</li>
                  )}
                  {results.summary.totalEventsInserted !== undefined && (
                    <li>Total Events Inserted: {results.summary.totalEventsInserted}</li>
                  )}
                  {results.summary.processedCount !== undefined && (
                    <li>Processed: {results.summary.processedCount}</li>
                  )}
                  {results.summary.successCount !== undefined && (
                    <li>Success: {results.summary.successCount}</li>
                  )}
                  {results.summary.failureCount !== undefined && (
                    <li>Failures: {results.summary.failureCount}</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
