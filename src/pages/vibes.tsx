import { useState, useMemo, useEffect } from "react";
import type { GetStaticProps, NextPage } from "next";
import { artistService } from "@/services/artistService";
import type { VibeArtist } from "@/types/artists";
import VibeChart from "@/components/VibeChart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export const VIBE_ARCHETYPES = ["All", "Dreamer", "Rebel", "Lover", "Rager"];

interface VibesPageProps {
  artists: VibeArtist[];
}

const VibesPage: NextPage<VibesPageProps> = ({ artists }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vibeFilter, setVibeFilter] = useState("All");
  const [artists, setArtists] = useState<VibeArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      const allArtists = await artistService.getAllArtists();
      setArtists(allArtists);
      setLoading(false);
    };
    fetchArtists();
  }, []);

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    return artists.filter(artist => {
      if (!artist.artist_name || !artist.primary_vibe) return false;

      const matchesSearch = artist.artist_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVibe = vibeFilter === "All" || 
                          artist.primary_vibe === vibeFilter || 
                          artist.secondary_vibe === vibeFilter;
      
      return matchesSearch && matchesVibe;
    });
  }, [artists, searchTerm, vibeFilter]);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <Image
          src="/OTWLogocolor.png"
          alt="OTW Logo Background"
          width={800}
          height={400}
          className="opacity-10 max-w-4xl w-full h-auto"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="sticky top-0 bg-black/90 backdrop-blur-sm z-20 p-4 border-b border-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/"}
                className="text-white hover:bg-gray-800 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white">OTW 750 Artist Vibe Chart</h1>
                <p className="text-gray-400 text-sm">Discover artists based on their energy and mood</p>
              </div>
            </div>

            <Card className="bg-gray-900/80 border-gray-700">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Search for an artist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  <Select value={vibeFilter} onValueChange={setVibeFilter}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Filter by vibe..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {VIBE_ARCHETYPES.map(vibe => (
                        <SelectItem key={vibe} value={vibe} className="text-white hover:bg-gray-700">
                          {vibe === "All" ? "All Vibes" : vibe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4 text-center">Artist Vibe Chart</h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
            Explore artists based on their musical vibes. The chart is divided into four quadrants: Dreamer (dark, chill), Rebel (dark, hype), Lover (bright, chill), and Rager (bright, hype).
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <p>Loading Vibe Chart...</p>
            </div>
          ) : (
            <VibeChart artists={filteredArtists} />
          )}
        </main>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const artists = await artistService.getAllArtistsForVibes();
    return {
      props: {
        artists: artists || [],
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Failed to fetch artists for vibes page:", error);
    return {
      props: {
        artists: [],
      },
    };
  }
};

export default VibesPage;
