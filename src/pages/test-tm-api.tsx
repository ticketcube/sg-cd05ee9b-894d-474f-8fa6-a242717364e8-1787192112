import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function TestTMApi() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [bulkRefreshRunning, setBulkRefreshRunning] = useState(false);
  const [artistName, setArtistName] = useState("Laufey");
  const [currentOffset, setCurrentOffset] = useState(0);
  const [batchSize] = useState(20);

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

  const updateAttractionIdsBatch = async (testMode: boolean, offset: number) => {
    if (!testMode && !confirm(`This will UPDATE attractionIds for batch starting at artist ${offset + 1}. Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/update-attraction-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          limit: batchSize, 
          offset,
          testMode 
        })
      });

      const data = await response.json();
      setResults(data);
      
      // Auto-advance offset for convenience
      if (data.summary?.hasMore) {
        setCurrentOffset(data.summary.nextOffset);
      }
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const resetBatch = () => {
    setCurrentOffset(0);
    setResults(null);
  };

  const calculateProgress = () => {
    if (!results?.summary) return 0;
    const { offset, batchSize, total } = results.summary;
    return Math.min(((offset + batchSize) / total) * 100, 100);
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
              <strong>Problem:</strong> Many artists have wrong attractionIds<br/>
              <strong>Solution:</strong> Process in batches of {batchSize} to avoid timeouts
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
              <CardTitle>Batch Update attractionIds ({batchSize} at a time)</CardTitle>
              {results?.summary && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Batch {results.summary.currentBatch} of {results.summary.totalBatches}</span>
                    <span>{Math.round(calculateProgress())}% complete</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  Current offset: <strong>{currentOffset}</strong> (artists {currentOffset + 1}-{currentOffset + batchSize})
                </div>
                <Button 
                  onClick={resetBatch} 
                  variant="ghost" 
                  size="sm"
                  className="ml-auto"
                >
                  Reset to Start
                </Button>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => updateAttractionIdsBatch(true, currentOffset)} 
                  disabled={loading}
                  variant="secondary"
                  className="flex-1"
                >
                  {loading ? "Testing..." : "🔍 Test Mode (Preview)"}
                </Button>
                <Button 
                  onClick={() => updateAttractionIdsBatch(false, currentOffset)} 
                  disabled={loading}
                  variant="default"
                  className="flex-1"
                >
                  {loading ? "Updating..." : "✅ Update Batch"}
                </Button>
              </div>

              {results?.summary?.hasMore && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateAttractionIdsBatch(false, results.summary.nextOffset)} 
                    disabled={loading}
                    variant="default"
                    className="flex-1"
                  >
                    {loading ? "Processing..." : `➡️ Next Batch (${results.summary.nextOffset + 1}-${results.summary.nextOffset + batchSize})`}
                  </Button>
                </div>
              )}

              {results?.summary && !results.summary.hasMore && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ✅ <strong>All batches complete!</strong> Processed {results.summary.total} artists.
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 space-y-1">
                <p><strong>Batch Size:</strong> {batchSize} artists per batch (~5-7 seconds)</p>
                <p><strong>Rate Limit:</strong> 250ms delay (4 req/sec) • TM limit: 5 req/sec</p>
                <p><strong>How it works:</strong> Click "Update Batch" → Process 20 artists → Click "Next Batch" → Repeat</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refresh-events" className="space-y-4">
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-bold mb-2">Step 2: Refresh Events (After attractionIds are correct)</h3>
            <p className="text-sm text-gray-700">
              <strong>Date Range:</strong> Today → 6 months<br/>
              <strong>Important:</strong> Only run this AFTER all attractionIds are updated
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
              {bulkRefreshRunning ? "Running... (~2 min)" : "⚡ Full Bulk Refresh"}
            </Button>
          </div>

          {bulkRefreshRunning && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-800">
                🔄 <strong>Bulk refresh in progress...</strong><br/>
                Processing all artists with attractionIds. This will take approximately 2 minutes.
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
                <h3 className="font-bold mb-2">Batch Summary:</h3>
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
