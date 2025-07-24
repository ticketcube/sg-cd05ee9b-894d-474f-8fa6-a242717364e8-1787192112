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

interface ArtistWithVotes extends Artist {
  vote_count: number;
}

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
    if (typeof genre === 'string' && genre) {
      const fetchArtists = async () => {
        try {
          setIsLoading(true);
          const decodedGenre = decodeURIComponent(genre);
          const fetchedArtists = await artistService.getArtistsByGenre(decodedGenre);
          
          // Add vote_count property to each artist (set to 0 for now)
          const artistsWithVotes: ArtistWithVotes[] = fetchedArtists.map(artist => ({
            ...artist,
            vote_count: 0
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
    // Toggle vote for this artist
    setSelectedArtists(prev => {
      if (prev.includes(artist.UUID)) {
        return prev.filter(id => id !== artist.UUID);
      } else {
        return [...prev, artist.UUID];
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

  const genreName = typeof genre === 'string' ? decodeURIComponent(genre) : 'Genre';

  return (
    <div className="container mx-auto p-4 bg-black text-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-3xl font-bold text-center sm:text-left">{genreName} Artists</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="bg-gray-800 border-gray-600 text-white"
        />
        <select onValueChange={handleSortChange} defaultValue={sortOrder}>
          <option className="w-full md:w-[180px] bg-gray-800 border-gray-600 text-white">
            Sort by
          </option>
          <option value="vote_count_desc">Votes (High to Low)</option>
          <option value="vote_count_asc">Votes (Low to High)</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <p>Loading artists...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedArtists.slice(0, visibleArtists).map((artist) => (
              <Card key={artist.UUID}>
                <CardHeader>
                  <CardTitle>{artist.artist_name}</CardTitle>
                  <Badge>{artist.vote_count} votes</Badge>
                </CardHeader>
                <CardContent>
                  <Image
                    src={artist.artist_image}
                    alt={artist.artist_name}
                    width={200}
                    height={200}
                  />
                  <Button onClick={() => handleVote(artist)}>
                    {selectedArtists.includes(artist.UUID) ? "Unvote" : "Vote"}
                  </Button>
                  <Link href={`/artist/${artist.UUID}`}>
                    <Button>View Artist</Button>
                  </Link>
                  <ArtistVideoPlayer videoUrl={artist.artist_video} />
                </CardContent>
              </Card>
            ))}
          </div>
          {visibleArtists < filteredAndSortedArtists.length && (
            <div className="text-center mt-8">
              <button 
                onClick={loadMoreArtists} 
                className="bg-transparent border border-white text-white hover:bg-white hover:text-black px-4 py-2 rounded"
              >
                Load More
              </button>
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

export default GenrePage;
