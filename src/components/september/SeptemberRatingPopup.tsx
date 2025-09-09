import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeeklyListArtist } from '@/services/septemberRewardsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, Star, Ticket, Users } from 'lucide-react';

interface SeptemberRatingPopupProps {
  artist: WeeklyListArtist;
  isOpen: boolean;
  onClose: () => void;
  onRatingComplete: (artistUuid: string, quadrantX: number, quadrantY: number) => void;
}

export default function SeptemberRatingPopup({ 
  artist, 
  isOpen, 
  onClose, 
  onRatingComplete 
}: SeptemberRatingPopupProps) {
  const [ticketInterest, setTicketInterest] = useState(50); // 0-100 scale
  const [shareInterest, setShareInterest] = useState(50); // 0-100 scale
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasVoted] = useState(false); // This could be passed in as a prop in the future

  const handleTicketInterestChange = (value: number[]) => {
    setTicketInterest(value[0]);
  };

  const handleShareInterestChange = (value: number[]) => {
    setShareInterest(value[0]);
  };

  const getTicketLabel = (value: number): string => {
    if (value < 20) return "Not For Me";
    if (value < 40) return "Maybe";
    if (value < 60) return "Interested";
    if (value < 80) return "Very Interested";
    return "I'd Buy Tickets!";
  };

  const handleSubmit = async () => {
    if (isSubmitting || userHasVoted) return;

    try {
      setIsSubmitting(true);
      
      // Convert 0-100 scale to -1 to 1 quadrant coordinates
      const quadrantX = (ticketInterest - 50) / 50; // Maps 0-100 to -1 to 1
      const quadrantY = (shareInterest - 50) / 50; // Maps 0-100 to -1 to 1

      await onRatingComplete(artist.uuid, quadrantX, quadrantY);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              {artist.artist_name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Artist Image */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700">
              {artist.artist_image ? (
                <img
                  src={artist.artist_image}
                  alt={artist.artist_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Rating Interface */}
          <div className="flex flex-col flex-1">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-white">Rate This Artist</h3>
                  
                  {/* Ticket Interest Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Concert Interest</span>
                    </div>
                    <div className="px-3">
                      <div className="relative mb-2">
                        <div 
                          className="absolute inset-0 h-3 rounded-full pointer-events-none z-0"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #ef4444 100%)`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        />
                        <Slider
                          value={[ticketInterest]} 
                          onValueChange={handleTicketInterestChange}
                          max={100}
                          step={1}
                          disabled={userHasVoted}
                          className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-7 [&_[data-radix-slider-thumb]]:h-7 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-800 [&_[data-radix-slider-thumb]]:shadow-xl [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform [&_[data-radix-slider-thumb]]:z-20"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Not For Me</span>
                        <span className="font-medium text-white">{getTicketLabel(ticketInterest)}</span>
                        <span>I'd Buy Tickets</span>
                      </div>
                    </div>
                  </div>

                  {/* Share Interest Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Sharing Interest</span>
                    </div>
                    <div className="px-3">
                      <div className="relative mb-2">
                        <div 
                          className="absolute inset-0 h-3 rounded-full pointer-events-none z-0"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #ef4444 100%)`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        />
                        <Slider
                          value={[shareInterest]}
                          onValueChange={handleShareInterestChange}
                          max={100}
                          step={1}
                          disabled={userHasVoted}
                          className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-7 [&_[data-radix-slider-thumb]]:h-7 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-800 [&_[data-radix-slider-thumb]]:shadow-xl [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform [&_[data-radix-slider-thumb]]:z-20"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Not For Them</span>
                        <span>I'd Tell Friends</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Points Preview */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-blue-200">
                  Earn Points!
                </span>
              </div>
              <p className="text-sm text-blue-300">
                Submit your rating to earn reward points
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || userHasVoted}
              className="w-full py-3 text-lg mt-6 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : userHasVoted ? (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Already Rated
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Submit Rating & Earn Points
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}