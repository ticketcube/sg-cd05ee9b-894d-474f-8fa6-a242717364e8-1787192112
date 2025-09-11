
import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuadrantRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    artistName: string;
    artistId: number;
    userId: string;
}

export function QuadrantRating({ onSubmit, artistName, artistId, userId }: QuadrantRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);
    const [timeRemaining, setTimeRemaining] = useState(15);
    const [hasMovedSliders, setHasMovedSliders] = useState(false);
    const [canSubmit, setCanSubmit] = useState(false);
    const [alreadyRated, setAlreadyRated] = useState(false);
    const [checkingRating, setCheckingRating] = useState(true);

    // Check if user has already rated this artist
    useEffect(() => {
        const checkExistingRating = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_engagements')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('artist_id', artistId)
                    .eq('engagement_type', 'quadrant_rating')
                    .gt('points_earned', 0)
                    .limit(1);

                if (error) {
                    console.error('Error checking existing rating:', error);
                    setAlreadyRated(false);
                } else {
                    setAlreadyRated(Boolean(data && data.length > 0));
                }
            } catch (error) {
                console.error('Error checking existing rating:', error);
                setAlreadyRated(false);
            } finally {
                setCheckingRating(false);
            }
        };

        if (userId && artistId) {
            checkExistingRating();
        }
    }, [userId, artistId]);

    // Timer countdown effect
    useEffect(() => {
        if (alreadyRated) {
            return;
        }

        if (timeRemaining <= 0) {
            setCanSubmit(true);
            return;
        }

        const timer = setTimeout(() => {
            setTimeRemaining(timeRemaining - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeRemaining, alreadyRated]);

    // Handle slider movement
    const handleTicketChange = useCallback((value: number[]) => {
        if (alreadyRated) return;
        setTicketInterest(value[0]);
        setHasMovedSliders(true);
        if (timeRemaining <= 0) {
            setCanSubmit(true);
        }
    }, [alreadyRated, timeRemaining]);

    const handleShareChange = useCallback((value: number[]) => {
        if (alreadyRated) return;
        setShareInterest(value[0]);
        setHasMovedSliders(true);
        if (timeRemaining <= 0) {
            setCanSubmit(true);
        }
    }, [alreadyRated, timeRemaining]);

    const handleRatingSubmit = useCallback(() => {
        if (alreadyRated) return;
        
        // Convert slider values (0-100) to quadrant coordinates (-1 to 1)
        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;

        onSubmit({ x, y });
    }, [alreadyRated, shareInterest, ticketInterest, onSubmit]);

    if (checkingRating) {
        return (
            <div className="flex flex-col justify-center h-full">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-muted-foreground mb-6">Checking rating status...</p>
            </div>
        );
    }

    if (alreadyRated) {
        return (
            <div className="flex flex-col justify-center h-full">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-muted-foreground mb-6">You've already earned points for rating this artist!</p>
                <Button 
                    className="mt-8 w-full bg-gray-500 hover:bg-gray-500"
                    disabled={true}
                >
                    ALREADY RATED!
                </Button>
            </div>
        );
    }

    const isTimerActive = timeRemaining > 0;
    const buttonText = isTimerActive 
        ? `Watch video for ${timeRemaining} seconds then rate artist`
        : canSubmit 
            ? "Submit Rating" 
            : hasMovedSliders 
                ? "Submit Rating" 
                : "Move sliders to submit rating";

    return (
        <div className="flex flex-col justify-center h-full">
            <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
            <p className="text-sm text-muted-foreground mb-6">Rate this artist to earn 10 points!</p>

            <div className="space-y-8">
                <div>
                    <label className="text-sm font-medium">How likely are you to buy a ticket to their show?</label>
                    <Slider
                        value={[ticketInterest]}
                        onValueChange={handleTicketChange}
                        className="my-4"
                        disabled={isTimerActive}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not Likely</span>
                        <span>Very Likely</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">How likely are you to share this with a friend?</label>
                    <Slider
                        value={[shareInterest]}
                        onValueChange={handleShareChange}
                        className="my-4"
                        disabled={isTimerActive}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not Likely</span>
                        <span>Very Likely</span>
                    </div>
                </div>
            </div>

            <Button 
                onClick={handleRatingSubmit} 
                className="mt-8 w-full"
                disabled={!canSubmit && !hasMovedSliders}
            >
                {isTimerActive && <Timer className="w-4 h-4 mr-2" />}
                {buttonText}
            </Button>
        </div>
    );
}
