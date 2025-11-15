import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function TestTMApi() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [bulkRefreshRunning, setBulkRefreshRunning] = useState(false);
  const [artistName, setArtistName] = useState("Laufey");
  const [attractionIdTest, setAttractionIdTest] = useState("K8vZ917_N8f"); // Banners - has upcoming shows
  const [currentOffset, setCurrentOffset] = useState(0);
  const [eventRefreshOffset, setEventRefreshOffset] = useState(0);
  const [eventRefreshBatchNumber, setEventRefreshBatchNumber] = useState(1); // NEW: Batch number selector
  const BATCH_SIZE = 20; // LOCKED - DO NOT CHANGE (prevents timeouts)

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

  const testAttractionIdDirect = async () => {
    setLoading(true);
    setResults(null);
    try {
      console.log("🧪 Testing attractionId:", attractionIdTest);
      const response = await fetch(`/api/ticketmaster/events-by-attraction?attractionId=${attractionIdTest}`);
      const data = await response.json();
      
      console.log("📦 API Response:", data);
      
      // Add extra metadata for debugging
      setResults({
        ...data,
        _debug: {
          timestamp: new Date().toISOString(),
          attractionIdTested: attractionIdTest,
          apiEndpoint: `/api/ticketmaster/events-by-attraction?attractionId=${attractionIdTest}`,
          responseStatus: response.status,
          responseOk: response.ok
        }
      });
    } catch (error) {
      console.error("❌ Test error:", error);
      setResults({ 
        error: error instanceof Error ? error.message : "Unknown error",
        attractionId: attractionIdTest
      });
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

  const updateAttractionIdsBatch = async (testMode: boolean, onlyMissing = false) => {
    const modeText = onlyMissing ? "missing attractionIds" : `${BATCH_SIZE} artists (${currentOffset + 1}-${currentOffset + BATCH_SIZE})`;
    if (!testMode && !confirm(`Update ${modeText}?\n\nThis will take ~5 seconds.`)) {
      return;
    }

    setLoading(true);
    setResults(null); // Clear previous results

    try {
      const response = await fetch("/api/admin/update-attraction-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          limit: BATCH_SIZE, 
          offset: onlyMissing ? 0 : currentOffset,
          testMode,
          onlyMissing
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Auto-advance offset if there's more to process (only in normal mode, not onlyMissing)
      if (data.summary?.hasMore && !testMode && !onlyMissing) {
        setCurrentOffset(data.summary.nextOffset);
      }
    } catch (error) {
      const errorResult = { 
        error: error instanceof Error ? error.message : "Unknown error",
        possibleCauses: [
          "API route timeout (processing took too long)",
          "Network connection issue",
          "Server error"
        ],
        suggestion: "Try again with the same offset to retry the failed batch"
      };
      setResults(errorResult);
      console.error("Batch update error:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Update offset when batch number changes
  const handleBatchNumberChange = (batchNum: number) => {
    const newBatchNumber = Math.max(1, batchNum);
    setEventRefreshBatchNumber(newBatchNumber);
    setEventRefreshOffset((newBatchNumber - 1) * BATCH_SIZE);
  };

  const resetBatch = () => {
    setCurrentOffset(0);
    setResults(null);
  };

  const skipBatch = () => {
    if (results?.summary?.hasMore) {
      setCurrentOffset(results.summary.nextOffset);
      setResults(null);
    }
  };

  const batchRefreshEvents = async () => {
    if (!confirm(`Refresh events for ${BATCH_SIZE} artists (${eventRefreshOffset + 1}-${eventRefreshOffset + BATCH_SIZE})?\n\nThis will take ~7-10 seconds.`)) {
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch("/api/admin/batch-refresh-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          limit: BATCH_SIZE, 
          offset: eventRefreshOffset
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Auto-advance offset if there are more artists
      if (data.results && data.results.length === BATCH_SIZE) {
        setEventRefreshOffset(eventRefreshOffset + BATCH_SIZE);
      }
    } catch (error) {
      const errorResult = { 
        error: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Try again with the same offset to retry the failed batch"
      };
      setResults(errorResult);
      console.error("Batch event refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetEventBatch = () => {
    setEventRefreshOffset(0);
    setResults(null);
  };

  const skipEventBatch = () => {
    setEventRefreshOffset(eventRefreshOffset + BATCH_SIZE);
    setResults(null);
  };

  const calculateProgress = () => {
    if (!results?.summary) return 0;
    const { offset, batchSize, total } = results.summary;
    return Math.min(((offset + batchSize) / total) * 100, 100);
  };

  const getProgressText = () => {
    if (!results?.summary) return "";
    const { currentBatch, totalBatches, total } = results.summary;
    return `Batch ${currentBatch} of ${totalBatches} (${currentOffset + 1}-${Math.min(currentOffset + BATCH_SIZE, total)} of ${total} artists)`;
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Ticketmaster API Admin Tools</h1>

      <Tabs defaultValue="test-attraction" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test-attraction">🔍 Test attractionId</TabsTrigger>
          <TabsTrigger value="attraction-ids">1. Find attractionIds</TabsTrigger>
          <TabsTrigger value="refresh-events">2. Refresh Events</TabsTrigger>
        </TabsList>

        <TabsContent value="test-attraction" className="space-y-4">
          <Alert className="bg-purple-50 border-purple-200">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>🧪 Direct attractionId Testing</strong><br/>
              Test a single attractionId to see raw TM API response and verify event fetching is working correctly.
              <div className="mt-2 text-sm font-mono bg-purple-100 p-2 rounded">
                Current test: Banners (K8vZ917_N8f) - Known to have upcoming shows
              </div>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Test Single attractionId</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={attractionIdTest}
                  onChange={(e) => setAttractionIdTest(e.target.value)}
                  placeholder="Enter attractionId"
                  className="flex-1 font-mono"
                />
                <Button onClick={testAttractionIdDirect} disabled={loading}>
                  {loading ? "Testing..." : "🎫 Test API Call"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Test attractionIds (known to have shows):</strong></p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    onClick={() => setAttractionIdTest("K8vZ917_N8f")} 
                    className="text-left text-blue-600 hover:underline"
                  >
                    K8vZ917_N8f - Banners ⭐
                  </button>
                  <button 
                    onClick={() => setAttractionIdTest("2503872")} 
                    className="text-left text-blue-600 hover:underline"
                  >
                    2503872 - Laufey
                  </button>
                  <button 
                    onClick={() => setAttractionIdTest("768011")} 
                    className="text-left text-blue-600 hover:underline"
                  >
                    768011 - Taylor Swift
                  </button>
                </div>
              </div>

              {results && !results.error && results.success && (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ API Call Successful</strong><br/>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div><strong>attractionId:</strong> {results.attractionId}</div>
                        <div><strong>Events Found:</strong> {results.eventsReturned}</div>
                        <div><strong>Total in TM:</strong> {results.totalEvents}</div>
                        <div><strong>Date Range:</strong> 6 months</div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {results.events && results.events.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">📅 Upcoming Events ({results.events.length}):</h3>
                      <div className="max-h-64 overflow-auto space-y-2">
                        {results.events.map((event: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded text-sm border">
                            <div className="font-medium text-blue-600">{event.name}</div>
                            <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                              <div>📍 {event.venue_name}, {event.venue_city}{event.venue_state ? `, ${event.venue_state}` : ""}</div>
                              <div>📅 {event.date} {event.time ? `at ${event.time}` : ""}</div>
                              <div className="font-mono text-xs text-gray-400">ID: {event.id}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.events && results.events.length === 0 && (
                    <Alert>
                      <AlertDescription>
                        No upcoming events found for this attractionId in the next 6 months.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {results && !results.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ API Error:</strong> {results.message || results.error}<br/>
                    {results.errorDetails && (
                      <pre className="mt-2 text-xs overflow-auto">{results.errorDetails}</pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>🔍 Raw API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs font-mono">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attraction-ids" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Step 1: Update attractionIds</strong><br/>
              Process {BATCH_SIZE} artists at a time (~5 seconds per batch). Click "Next Batch" to continue through all artists.
            </AlertDescription>
          </Alert>

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
              <CardTitle>Batch Update attractionIds</CardTitle>
              {results?.summary && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{getProgressText()}</span>
                    <span>{Math.round(calculateProgress())}% complete</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: Update Only Missing Button */}
              <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">🔄 Update Only Missing attractionIds</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Only process artists that don't have an attractionId yet (~1% of artists)
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => updateAttractionIdsBatch(false, true)} 
                  disabled={loading}
                  variant="default"
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {loading ? "Updating..." : "🎯 Update Missing Only"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or process by batch</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Batch Position</p>
                    <p className="text-sm text-gray-600">
                      Artists {currentOffset + 1} - {currentOffset + BATCH_SIZE}
                    </p>
                  </div>
                  <Button 
                    onClick={resetBatch} 
                    variant="ghost" 
                    size="sm"
                  >
                    Reset to Start
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                  <p><strong>Batch Size:</strong> {BATCH_SIZE} artists (locked)</p>
                  <p><strong>Time:</strong> ~5 seconds per batch</p>
                  <p><strong>Rate Limit:</strong> 250ms between requests (4 req/sec)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => updateAttractionIdsBatch(true, false)} 
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? "Testing..." : "🔍 Test Preview"}
                </Button>
                <Button 
                  onClick={() => updateAttractionIdsBatch(false, false)} 
                  disabled={loading}
                  variant="default"
                >
                  {loading ? "Updating..." : "✅ Update Batch"}
                </Button>
              </div>

              {results?.summary && !results?.error && (
                <div className="space-y-2">
                  <Button 
                    onClick={updateAttractionIdsBatch} 
                    disabled={loading}
                    variant="default"
                    className="w-full"
                  >
                    ➡️ Process Next Batch ({results.summary.nextOffset + 1}-{results.summary.nextOffset + BATCH_SIZE})
                  </Button>
                  <Button 
                    onClick={skipBatch} 
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Skip to Next Batch →
                  </Button>
                </div>
              )}

              {results?.summary && !results.summary.hasMore && !results?.error && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>✅ All batches complete!</strong><br/>
                    Processed {results.summary.total} artists successfully.
                  </AlertDescription>
                </Alert>
              )}

              {results?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {results.error}<br/>
                    {results.suggestion && <span className="text-sm">{results.suggestion}</span>}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refresh-events" className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Step 2: Refresh Events</strong><br/>
              Only run this AFTER all attractionIds are updated in Step 1. Process {BATCH_SIZE} artists at a time.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Batch Event Refresh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NEW: Batch Number Selector */}
              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded space-y-3">
                <div>
                  <p className="font-medium text-blue-900">📍 Select Starting Batch</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose which batch to start from. Each batch = {BATCH_SIZE} artists.
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium whitespace-nowrap">Start from Batch:</label>
                  <Input
                    type="number"
                    min="1"
                    value={eventRefreshBatchNumber}
                    onChange={(e) => handleBatchNumberChange(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">
                    (Artists {eventRefreshOffset + 1}-{eventRefreshOffset + BATCH_SIZE})
                  </span>
                  <Button 
                    onClick={resetEventBatch} 
                    variant="ghost" 
                    size="sm"
                  >
                    Reset to Batch 1
                  </Button>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t space-y-1">
                  <p><strong>💡 Tip:</strong> Check the <code>batch_progress</code> table to see where you left off</p>
                  <p><strong>Example:</strong> If you stopped at offset 240, start from batch 13</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Batch Position</p>
                    <p className="text-sm text-gray-600">
                      Batch {eventRefreshBatchNumber} • Artists {eventRefreshOffset + 1} - {eventRefreshOffset + BATCH_SIZE}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                  <p><strong>Batch Size:</strong> {BATCH_SIZE} artists</p>
                  <p><strong>Date Range:</strong> Next 6 months (upcoming events only)</p>
                  <p><strong>Time:</strong> ~7-10 seconds per batch</p>
                  <p><strong>Rate Limit:</strong> 250ms between requests</p>
                </div>
              </div>

              <Button 
                onClick={batchRefreshEvents} 
                disabled={loading}
                variant="default"
                className="w-full"
              >
                {loading ? "Refreshing Events..." : "🔄 Refresh Events for This Batch"}
              </Button>

              {results?.summary && !results?.error && (
                <div className="p-4 bg-green-50 rounded space-y-2">
                  <h3 className="font-bold text-green-800">✅ Batch Complete</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Artists Processed:</strong> {results.summary.processed}</div>
                    <div><strong>New Events:</strong> {results.summary.totalNewEvents}</div>
                    <div><strong>Updated Events:</strong> {results.summary.totalUpdatedEvents}</div>
                    <div><strong>Cancelled Events:</strong> {results.summary.totalCancelledEvents}</div>
                    <div><strong>Errors:</strong> {results.summary.errors}</div>
                  </div>
                </div>
              )}

              {results?.summary && results.summary.processed === BATCH_SIZE && !results?.error && (
                <div className="space-y-2">
                  <Button 
                    onClick={batchRefreshEvents} 
                    disabled={loading}
                    variant="default"
                    className="w-full"
                  >
                    ➡️ Process Next Batch ({eventRefreshOffset + 1}-{eventRefreshOffset + BATCH_SIZE})
                  </Button>
                  <Button 
                    onClick={skipEventBatch} 
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Skip to Next Batch →
                  </Button>
                </div>
              )}

              {results?.summary && results.summary.processed < BATCH_SIZE && results.summary.processed > 0 && !results?.error && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>✅ All artists processed!</strong><br/>
                    No more artists with attractionIds to refresh.
                  </AlertDescription>
                </Alert>
              )}

              {results?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {results.error}<br/>
                    {results.suggestion && <span className="text-sm">{results.suggestion}</span>}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tests (Single Artists)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={testSingleArtist} disabled={loading || bulkRefreshRunning}>
                  {loading ? "Testing..." : "Test Single Artist (Laufey)"}
                </Button>

                <Button onClick={testMultipleArtists} disabled={loading || bulkRefreshRunning} variant="secondary">
                  {loading ? "Testing..." : "Test 5 Artists"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {bulkRefreshRunning && (
            <Alert className="bg-yellow-50 border-yellow-400">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                🔄 <strong>Bulk refresh in progress...</strong><br/>
                Processing all artists with attractionIds. This will take approximately 2 minutes.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {results && !results.error && results.results && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Results (Per Artist)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-auto">
              {results.results.map((result: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium mb-1">{result.artistName}</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>attractionId: {result.attractionId}</div>
                    {result.error ? (
                      <div className="text-red-600">❌ Error: {result.error}</div>
                    ) : (
                      <>
                        <div>✨ New: {result.newEvents} | 🔄 Updated: {result.updatedEvents} | ⚠️ Cancelled: {result.cancelledEvents}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results && !results.error && results.summary && !results.results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.summary && (
              <div className="mb-4 p-4 bg-blue-50 rounded space-y-2">
                <h3 className="font-bold">Batch Summary:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Total Artists:</strong> {results.summary.total}</div>
                  <div><strong>Current Batch:</strong> {results.summary.currentBatch} of {results.summary.totalBatches}</div>
                  <div><strong>Updated:</strong> {results.summary.updated}</div>
                  <div><strong>Skipped:</strong> {results.summary.skipped}</div>
                  <div><strong>Failed:</strong> {results.summary.failed}</div>
                  <div><strong>More to Process:</strong> {results.summary.hasMore ? "Yes" : "No"}</div>
                </div>
              </div>
            )}

            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
