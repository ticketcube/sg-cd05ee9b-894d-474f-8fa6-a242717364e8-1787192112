import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnrichedWeeklyListArtist } from '@/types/weekly';

export interface WeeklyRatingsQuadrantProps {
  onSelectionChange: (selection: { x: number; y: number } | null) => void;
  initialSelection?: { x: number; y: number } | null;
  disabled?: boolean;
  artist?: EnrichedWeeklyListArtist;
}

export default function WeeklyRatingsQuadrant({
  onSelectionChange,
  initialSelection = null,
  disabled = false,
  artist,
}: WeeklyRatingsQuadrantProps) {
  const [selection, setSelection] = useState<{ x: number; y: number } | null>(initialSelection);
  const [dotImage, setDotImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (artist?.artist_image) {
      setDotImage(artist.artist_image);
    }
  }, [artist]);

  const handleQuadrantClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
    
    // Convert coordinates to rating values (0-10)
    const newX = Math.round((x + 1) * 5); // 0 to 10
    const newY = Math.round((1 - y) * 5); // 0 to 10 (inverted y)
    
    const newSelection = { x: newX, y: newY };
    setSelection(newSelection);
    onSelectionChange(newSelection);
  };

  const handleClear = () => {
    setSelection(null);
    onSelectionChange(null);
  };

  return (
    <div className="grid gap-4">
      <Card key={artist?.artist_uuid} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={artist?.artist_image || artist?.profile_image_url} 
              alt={artist?.artist_name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{artist?.artist_name}</h3>
              <p className="text-sm text-gray-600">{artist?.artist_genre}</p>
            </div>
          </div>
          
          <div 
            className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleQuadrantClick}
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
            
            {selection && (
              <div 
                className="absolute w-3 h-3 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${((selection.x / 10) * 100)}%`,
                  top: `${(1 - (selection.y / 10)) * 100}%`
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}