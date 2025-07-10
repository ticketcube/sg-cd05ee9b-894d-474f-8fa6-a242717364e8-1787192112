import { useState, useEffect, useCallback } from 'react';
import { Artist, artistService } from '@/services/artistService';
import { votingService } from '@/services/votingService';
import { ArtistChart } from '@/components/ArtistChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type VotingState = 'initial' | 'voting' | 'submitted';

export default function HomePage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<number[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  const [votingState, setVotingState] = useState<VotingState>('initial');

  const loadArtists = useCallback(async () => {
    const data = await artistService.getArtists({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      genres: selectedGenres.length > 0 ? selectedGenres : undefined
    });
    setArtists(data);

    // Extract unique categories and genres from all artists, not just filtered ones
    const allArtists = await artistService.getArtists();
    const categories = [...new Set(allArtists.map(a => a.artist_otwcategory).filter(Boolean) as string[])]
      .filter(category => category !== '["Top100","Top25"]'); // Remove Top 100/Top 25 option
    
    // Since genre is now a text field, we need to split and extract individual genres
    const allGenres = allArtists
      .map(a => a.artist_genre)
      .filter(Boolean)
      .flatMap(genre => genre?.split(',').map(g => g.trim()) || [])
      .filter(Boolean);
    const genres = [...new Set(allGenres)];
    
    setUniqueCategories(categories);
    setUniqueGenres(genres);
  }, [selectedCategory, selectedGenres]);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  const handleVote = (artist: Artist) => {
    if (!username) {
      setIsUsernameDialogOpen(true);
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
  };

  const handleStartVoting = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    setVotingState('voting');
    setIsUsernameDialogOpen(false);
  };

  const handleSubmitVotes = async () => {
    if (selectedArtists.length === 0) {
      alert('Please select at least one artist before submitting');
      return;
    }

    try {
      await votingService.submitVotes(username, selectedArtists);
      setVotingState('submitted');
      setIsSubmissionDialogOpen(true);
    } catch (error) {
      console.error('Error submitting votes:', error);
      alert('Error submitting votes. Please try again.');
    }
  };

  const handleEnterDrawing = async () => {
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }

    try {
      await votingService.enterTicketDrawing(email, username);
      setIsSubmissionDialogOpen(false);
      setShowThankYou(true);
      setTimeout(() => {
        resetVoting();
      }, 3000);
    } catch (error) {
      console.error('Error entering drawing:', error);
      alert('Error entering drawing. Please try again.');
    }
  };

  const resetVoting = () => {
    setVotingState('initial');
    setUsername('');
    setEmail('');
    setSelectedArtists([]);
    setIsUsernameDialogOpen(false);
    setIsSubmissionDialogOpen(false);
    setShowThankYou(false);
  };

  const getMainButtonText = () => {
    switch (votingState) {
      case 'initial':
        return 'CLICK HERE TO VOTE FOR YOUR TOP 25 FAVORITES!';
      case 'voting':
        return 'SUBMIT YOUR VOTES';
      case 'submitted':
        return 'VOTES SUBMITTED';
      default:
        return 'CLICK HERE TO VOTE FOR YOUR TOP 25 FAVORITES!';
    }
  };

  const handleMainButtonClick = () => {
    switch (votingState) {
      case 'initial':
        setIsUsernameDialogOpen(true);
        break;
      case 'voting':
        handleSubmitVotes();
        break;
      case 'submitted':
        // Do nothing, votes already submitted
        break;
    }
  };

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-500">Thank You!</h1>
          <p className="text-xl">You have been entered into the drawing for free tickets.</p>
          <p className="text-lg mt-2">Returning to main screen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-500">10 Years of OTW Artists</h1>
      
      <Button
        className="mb-8 w-full text-xl py-8 bg-white text-black hover:bg-gray-100"
        onClick={handleMainButtonClick}
        disabled={votingState === 'submitted'}
      >
        {getMainButtonText()}
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

      {/* Username Dialog */}
      <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
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
          <Button onClick={handleStartVoting}>
            Start Voting
          </Button>
        </DialogContent>
      </Dialog>

      {/* Submission Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votes Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <p className="mb-4">You voted for {selectedArtists.length} artists.</p>
          
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter your email for free tickets drawing"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Button 
                className="w-full mt-2 bg-green-500 hover:bg-green-600"
                onClick={handleEnterDrawing}
              >
                ENTER DRAWING FOR FREE TICKETS
              </Button>
            </div>
            
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={resetVoting}
            >
              FINISH VOTING
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
