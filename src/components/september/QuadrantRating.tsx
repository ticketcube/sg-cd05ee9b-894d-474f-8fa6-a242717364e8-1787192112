import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface QuadrantRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    pointsEarned: number | null;
}

export function QuadrantRating({ onSubmit }: QuadrantRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);

    const handleRatingSubmit = () => {
        // Convert slider values (0-100) to quadrant coordinates (-1 to 1)
        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;

        onSubmit({ x, y });
    };

    return (
        <div className="flex flex-col justify-center h-full">
            <h3 className="text-lg font-semibold mb-2">Rate This Video</h3>
            <p className="text-sm text-muted-foreground mb-6">Your feedback helps us recommend better music and rewards.</p>

         {pointsEarned !== null && pointsEarned > 0 && (
            <div className="p-2 mb-4 bg-green-100 dark:bg-green-900/50 rounded-md text-center text-sm font-medium text-green-700 dark:text-green-300">
                +{pointsEarned} Points for watching!
            </div>
              )}

            <div className="space-y-8">
                <div>
                    <label className="text-sm font-medium">How likely are you to buy a ticket to their show?</label>
                    <Slider
                        value={[ticketInterest]}
                        onValueChange={(value) => setTicketInterest(value[0])}
                        className="my-4"
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
                        onValueChange={(value) => setShareInterest(value[0])}
                        className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Not Likely</span>
                        <span>Very Likely</span>
                    </div>
                </div>
            </div>

            <Button onClick={handleRatingSubmit} className="mt-8 w-full">Submit Rating</Button>
        </div>
    );
}