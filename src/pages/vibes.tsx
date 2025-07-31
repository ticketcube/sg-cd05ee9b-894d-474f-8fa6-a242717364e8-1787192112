import { useState, useEffect } from "react";
import { artistService } from "@/services/artistService";
import type { VibeArtist } from "@/types/artists";
import VibeChart from "@/components/VibeChart";
import { Loader2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

export default function VibesPage() {
  const [artists, setArtists] = useState<VibeArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const fetchedArtists = await artistService.getArtistsByVibe("any");
        
        const vibeArtists = fetchedArtists.map(artist => ({
          ...artist,
          primary_vibe: artist.primary_vibe || "Unknown",
          secondary_vibe: artist.secondary_vibe || null,
        }));
        
        setArtists(vibeArtists as VibeArtist[]);
      } catch (err) {
        setError("Failed to load artist data.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white p-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-500">Artist Vibe Chart</h1>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <VibeChart artists={artists} />
        )}
      </div>
    </Auth-Guard>
  );
}
