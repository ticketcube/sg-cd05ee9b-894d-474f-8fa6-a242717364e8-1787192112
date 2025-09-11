
import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';

interface QuadrantRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    artistName: string;
}

export function QuadrantRating({ onSubmit, artistName }: QuadrantRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);
    const [timeRemaining, setTimeRemaining] = useState(15);
    const [hasMovedSliders, setHasMovedSliders] = useState(false);
    const [canSubmit, setCanSubmit] = useState(false);

    // Timer countdown effect
    useEffect(() => {
        if (timeRemaining <= 0) {
            setCanSubmit(true);
            return;
        }

        const timer = setTimeout(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeRemaining]);

    // Handle slider movement
    const handleTicketChange = (value: number[]) => {
        setTicketInterest(value[0]);
        if (!hasMovedSliders) {
            setHasMovedSliders(true);
        }
        // Enable submit after timer AND slider movement
        if (timeRemaining <= 0) {
            setCanSubmit(true);
        }
    };

    const handleShareChange = (value: number[]) => {
        setShareInterest(value[0]);
        if (!hasMovedSliders) {
            setHasMovedSliders(true);
        }
        // Enable submit after timer AND slider movement
        if (timeRemaining <= 0) {
            setCanSubmit(true);
        }
    };

    const handleRatingSubmit = () => {
        // Convert slider values (0-100) to quadrant coordinates (-1 to 1)
        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;

        onSubmit({ x, y });
    };

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
