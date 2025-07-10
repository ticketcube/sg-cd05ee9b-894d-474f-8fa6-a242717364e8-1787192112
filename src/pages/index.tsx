import { useState, useEffect, useCallback } from 'react';
import { Artist, artistService } from '@/services/artistService';
import { ArtistChart } from '@/components/ArtistChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HomePage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<number[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);

  const loadArtists = useCallback(async () => {
    const data = await artistService.getArtists({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      genres: selectedGenres.length > 0 ? selectedGenres : undefined
    });
    setArtists(data);

    // Extract unique categories and genres from all artists, not just filtered ones
    const allArtists = await artistService.getArtists();
    const categories = [...new Set(allArtists.map(a => a.artist_otwcategory).filter(Boolean) as string[])];
    const genres = [...new Set(allArtists.flatMap(a => a.artist_genre || []).filter(Boolean) as string[])];
    
    setUniqueCategories(categories);
    setUniqueGenres(genres);
  }, [selectedCategory, selectedGenres]);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  const handleVote = async (artist: Artist) => {
    if (!username) {
      setIsVotingOpen(true);
      return;
    }

    if (selectedArtists.length >= 25 && !selectedArtists.includes(artist.artist_otwid || 0)) {
      alert('You can only select up to 25 artists!');
      return;
    }

    if (selectedArtists.includes(artist.artist_otwid || 0)) {
      setSelectedArtists(prev => prev.filter(id => id !== (artist.artist_otwid || 0)));
    } else {
      setSelectedArtists(prev => [...prev, artist.artist_otwid || 0]);
    }

    try {
      await artistService.submitVote({ username, artist_otwid: artist.artist_otwid || null });
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">10 Years of OTW Artists</h1>
      
      <Button
        className="mb-8 w-full text-xl py-8 bg-white text-black hover:bg-gray-100"
        onClick={() => setIsVotingOpen(true)}
      >
        VOTE FOR YOUR TOP 25 FAVORITE ARTISTS
      </Button>
      
      <div className="mb-8 flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedGenres[0] || "all"}
          onValueChange={(value) => setSelectedGenres(value === "all" ? [] : [value])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {uniqueGenres.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ArtistChart artists={artists} onVote={handleVote} selectedArtists={selectedArtists} />

      <Dialog open={isVotingOpen} onOpenChange={setIsVotingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Username</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Selected: {selectedArtists.length}/25 artists
          </p>
          <Button onClick={() => setIsVotingOpen(false)}>
            Start Voting
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
