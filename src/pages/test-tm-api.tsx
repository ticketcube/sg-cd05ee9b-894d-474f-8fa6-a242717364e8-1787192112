import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestTMApi() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

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

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Ticketmaster API Test</h1>

      <div className="flex gap-4 mb-6">
        <Button onClick={testSingleArtist} disabled={loading}>
          {loading ? "Testing..." : "Test Single Artist (Laufey)"}
        </Button>

        <Button onClick={testMultipleArtists} disabled={loading} variant="secondary">
          {loading ? "Testing..." : "Test 5 Artists"}
        </Button>
      </div>

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
                  <li>Artists Tested: {results.summary.totalArtists}</li>
                  <li>Artists with Events: {results.summary.artistsWithEvents}</li>
                  <li>Total Events Found: {results.summary.totalEventsFound}</li>
                  <li>Total Events Inserted: {results.summary.totalEventsInserted}</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
