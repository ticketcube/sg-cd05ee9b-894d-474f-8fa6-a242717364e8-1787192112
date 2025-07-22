
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Music, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ArtistResult {
  artist: string;
  url: string | null;
  error?: string;
}

export default function YouTubeUrlPage() {
  const [artistList, setArtistList] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!artistList.trim()) {
      setError('Please enter at least one artist name');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const artists = artistList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const response = await fetch('/api/youtube-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artists }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch YouTube URLs');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setArtistList('');
    setResults([]);
    setError('');
  };

  const successCount = results.filter(r => r.url).length;
  const failureCount = results.filter(r => !r.url).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              YouTube URL Finder
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Find the most popular YouTube videos for your favorite artists
          </p>
        </div>

        {/* Input Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Artist Names
            </CardTitle>
            <CardDescription>
              Enter artist names, one per line. We'll find their most popular YouTube video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter artist names, one per line:&#10;&#10;Taylor Swift&#10;Ed Sheeran&#10;Billie Eilish&#10;The Weeknd"
              value={artistList}
              onChange={(e) => setArtistList(e.target.value)}
              className="min-h-32 resize-none border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              disabled={loading}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !artistList.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Videos...
                  </>
                ) : (
                  'Find YouTube URLs'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={loading}
                className="hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Results
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {successCount} Found
                  </Badge>
                  {failureCount > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {failureCount} Not Found
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                YouTube URLs for {results.length} artist{results.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80">
                      <TableHead className="font-semibold">Artist Name</TableHead>
                      <TableHead className="font-semibold">YouTube URL</TableHead>
                      <TableHead className="font-semibold w-20">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow 
                        key={index} 
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <TableCell className="font-medium">
                          {result.artist}
                        </TableCell>
                        <TableCell>
                          {result.url ? (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
                            >
                              <span className="truncate max-w-md">
                                {result.url}
                              </span>
                              <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-500 italic">
                              {result.error ? `Error: ${result.error}` : 'No video found'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.url ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Found
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              Not Found
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="shadow-lg border-0 bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Enter artist names, one per line in the text area above</p>
            <p>• Click "Find YouTube URLs" to search for their most popular videos</p>
            <p>• Results will show the YouTube URL or "Not Found" if no video is available</p>
            <p>• Click on any URL to open the video in a new tab</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
