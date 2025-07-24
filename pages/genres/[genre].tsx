
    import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import { artistService } from "@/services/artistService";
import type { Artist, ArtistWithVotes } from "@/types/artists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const GenrePage = () => {
  const router = useRouter();
  const { genre } = router.query;

  const [artists, setArtists] = useState<ArtistWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("vote_count_desc");
  const [visibleArtists, setVisibleArtists] = useState(25);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  useEffect(() => {
    if (typeof genre === "string" && genre) {
      const fetchArtists = async () => {
        try {
          setIsLoading(true);
          const decodedGenre = decodeURIComponent(genre);
          const fetchedArtists = await artistService.getArtistsByGenre(decodedGenre);
          
          const artistsWithVotes: ArtistWithVotes[] = fetchedArtists.map(artist => ({
            ...artist,
            vote_count: 0 // Placeholder for vote count
          }));
          
          setArtists(artistsWithVotes);
        } catch (error) {
          console.error(`Error fetching artists for genre ${genre}:`, error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArtists();
    }
  }, [genre]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  const loadMoreArtists = () => {
    setVisibleArtists((prev) => prev + 25);
  };

  const handleVote = (artist: Artist) => {
    setSelectedArtists(prev => {
      if (prev.includes(artist.uuid)) {
        return prev.filter(id => id !== artist.uuid);
      } else {
        if (prev.length >= 25) {
          alert("You can vote for a maximum of 25 artists.");
          return prev;
        }
        return [...prev, artist.uuid];
      }
    });
  };

  const filteredAndSortedArtists = artists
    .filter((artist) =>
      artist.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "vote_count_desc":
          return (b.vote_count ?? 0) - (a.vote_count ?? 0);
        case "vote_count_asc":
          return (a.vote_count ?? 0) - (b.vote_count ?? 0);
        case "name_asc":
          return a.artist_name.localeCompare(b.artist_name);
        case "name_desc":
          return b.artist_name.localeCompare(a.artist_name);
        default:
          return 0;
      }
    });

  const genreName = typeof genre === "string" ? decodeURIComponent(genre) : "Genre";

  return (
    <div className="container mx-auto p-4 bg-black text-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">{genreName} Artists</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="bg-gray-800 border-gray-600 text-white"
        />
        <Select onValueChange={handleSortChange} defaultValue={sortOrder}>
          <SelectTrigger className="w-full md:w-[180px] bg-gray-800 border-gray-600 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vote_count_desc">Votes (High to Low)</SelectItem>
            <SelectItem value="vote_count_asc">Votes (Low to High)</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <p>Loading artists...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedArtists.slice(0, visibleArtists).map((artist) => (
              <Card key={artist.uuid} className="bg-gray-900 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="truncate">{artist.artist_name}</CardTitle>
                  <Badge>{artist.vote_count} votes</Badge>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  {artist.artist_image && (
                    <Image
                      src={artist.artist_image}
                      alt={artist.artist_name}
                      width={200}
                      height={200}
                      className="rounded-md object-cover aspect-square"
                    />
                  )}
                  <ArtistVideoPlayer artist={artist} size="sm" />
                  <div className="flex gap-2 w-full">
                    <Button onClick={() => handleVote(artist)} className="flex-1">
                      {selectedArtists.includes(artist.uuid) ? "Unvote" : "Vote"}
                    </Button>
                    <Link href={`/artist/${artist.uuid}`} passHref>
                      <Button variant="outline" className="flex-1">View Artist</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {visibleArtists < filteredAndSortedArtists.length && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMoreArtists} 
                variant="outline"
              >
                Load More
              </Button>
            </div>
          )}
          {filteredAndSortedArtists.length === 0 && (
            <div className="text-center mt-8">
                <p>No artists found for this genre.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
  