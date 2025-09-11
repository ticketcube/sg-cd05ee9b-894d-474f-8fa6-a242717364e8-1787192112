import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';

interface QuadrantRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    artistName: string;
    artistId: number;
    userId: string;
    alreadyRated: boolean;
    checkingRating: boolean;
}

export function QuadrantRating({ 
    onSubmit, 
    artistName, 
    artistId, 
    userId, 
    alreadyRated, 
    checkingRating 
}: QuadrantRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);
    const [timeRemaining, setTimeRemaining] = useState(15);
    const [hasMovedSliders, setHasMovedSliders] = useState(false);

    // Simple timer
    useEffect(() => {
        if (timeRemaining > 0 && !alreadyRated) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    });

    const handleTicketChange = (value: number[]) => {
        if (alreadyRated) return;
        setTicketInterest(value[0]);
        setHasMovedSliders(true);
    };

    const handleShareChange = (value: number[]) => {
        if (alreadyRated) return;
        setShareInterest(value[0]);
        setHasMovedSliders(true);
    };

    const handleSubmit = () => {
        if (alreadyRated) return;
        
        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;
        onSubmit({ x, y });
    };

    if (checkingRating) {
        return (
            <div className="flex flex-col justify-center h-full">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-muted-foreground mb-6">Loading...</p>
            </div>
        );
    }

    if (alreadyRated) {
        return (
            <div className="flex flex-col justify-center h-full">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-muted-foreground mb-6">Already rated!</p>
                <Button 
                    className="mt-8 w-full bg-gray-500 hover:bg-gray-500"
                    disabled={true}
                >
                    ALREADY RATED!
                </Button>
            </div>
        );
    }

    const canSubmit = timeRemaining <= 0 && hasMovedSliders;
    const isTimerActive = timeRemaining > 0;

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
                onClick={handleSubmit} 
                className="mt-8 w-full"
                disabled={!canSubmit}
            >
                {isTimerActive && <Timer className="w-4 h-4 mr-2" />}
                {isTimerActive 
                    ? `Watch video for ${timeRemaining} seconds then rate artist`
                    : canSubmit 
                        ? "Submit Rating" 
                        : "Move sliders to submit rating"
                }
            </Button>
        </div>
    );
}