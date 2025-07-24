
import { useState, useMemo } from "react";
import type { GetStaticProps, NextPage } from "next";
import { artistService } from "@/services/artistService";
import type { VibeArtist } from "@/types/artists";
import VibeChart from "@/components/VibeChart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export const VIBE_ARCHETYPES = ["All", "Dreamer", "Rebel", "Lover", "Rager"];

interface VibesPageProps {
  artists: VibeArtist[];
}

const VibesPage: NextPage<VibesPageProps> = ({ artists }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vibeFilter, setVibeFilter] = useState("All");

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
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Artist Vibe Chart</h1>
        <p className="text-muted-foreground mt-2">Discover new artists based on their energy and mood.</p>
      </header>

      <Card className="mb-8">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              placeholder="Search for an artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Select value={vibeFilter} onValueChange={setVibeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by vibe..." />
              </SelectTrigger>
              <SelectContent>
                {VIBE_ARCHETYPES.map(vibe => (
                  <SelectItem key={vibe} value={vibe}>
                    {vibe === "All" ? "All Vibes" : vibe}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <VibeChart artists={filteredArtists} />
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
      revalidate: 3600, // Re-generate the page every hour
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
