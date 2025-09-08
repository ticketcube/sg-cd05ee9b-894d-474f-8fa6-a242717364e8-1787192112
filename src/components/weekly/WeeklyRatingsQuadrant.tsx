// src/components/weekly/WeeklyRatingsQuadrant.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { EnrichedWeeklyListArtist, ArtistRating } from '@/types/weekly';

interface WeeklyRatingsQuadrantProps {
  artists: EnrichedWeeklyListArtist[];
  ratings: ArtistRating[];
  onRating: (artistUuid: string, ticketInterest: number, shareInterest: number) => void;
}

export default function WeeklyRatingsQuadrant({ artists, ratings, onRating }: WeeklyRatingsQuadrantProps) {
  const handleQuadrantClick = (event: React.MouseEvent<HTMLDivElement>, artist: EnrichedWeeklyListArtist) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
    
    // Convert coordinates to rating values (0-10)
    const ticketInterest = Math.round((x + 1) * 5); // 0 to 10
    const shareInterest = Math.round((1 - y) * 5); // 0 to 10 (inverted y)
    
    onRating(artist.artist_uuid, ticketInterest, shareInterest);
  };

  return (
    <div className="grid gap-4">
      {artists.map((artist) => {
        const rating = ratings.find(r => r.artistUuid === artist.artist_uuid);
        
        return (
          <Card key={artist.artist_uuid} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={artist.artist_image || artist.profile_image_url} 
                  alt={artist.artist_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{artist.artist_name}</h3>
                  <p className="text-sm text-gray-600">{artist.artist_genre}</p>
                </div>
                <Button size="sm" variant="outline">
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </Button>
              </div>
              
              <div 
                className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={(e) => handleQuadrantClick(e, artist)}
              >
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-r border-b border-gray-200 flex items-center justify-center text-xs text-gray-500">
                    Low Ticket<br />High Share
                  </div>
                  <div className="border-b border-gray-200 flex items-center justify-center text-xs text-gray-500">
                    High Ticket<br />High Share
                  </div>
                  <div className="border-r border-gray-200 flex items-center justify-center text-xs text-gray-500">
                    Low Ticket<br />Low Share
                  </div>
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    High Ticket<br />Low Share
                  </div>
                </div>
                
                {rating && (
                  <div 
                    className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${((rating.ticketInterest || 0) / 10) * 100}%`,
                      top: `${(1 - (rating.shareInterest || 0) / 10) * 100}%`
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}