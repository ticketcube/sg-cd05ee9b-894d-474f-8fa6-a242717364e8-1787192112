import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { artistService } from "@/services/artistService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Music } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

type GenreCounts = { [key: string]: number };

export default function GenresPage() {
  const router = useRouter();
  const [genreCounts, setGenreCounts] = useState<GenreCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenreCounts = async () => {
      try {
        const counts = await artistService.getGenreCounts();
        setGenreCounts(counts);
      } catch (err) {
        console.error("Failed to load genre data:", err);
        setError("Failed to load genre data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchGenreCounts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-center">
        <div>
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/discovery-charts")}
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Charts
              </Button>
              <h1 className="text-2xl font-bold text-blue-500">
                Groover Charts by Genre
              </h1>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(genreCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([genre, count]) => (
                <Card
                  key={genre}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => router.push(`/genres/${encodeURIComponent(genre)}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-400" />
                      {genre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{count} artists</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
