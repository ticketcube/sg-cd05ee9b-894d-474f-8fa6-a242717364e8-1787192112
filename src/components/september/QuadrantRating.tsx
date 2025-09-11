import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Timer } from 'lucide-react';
import clsx from 'clsx';

interface QuadrantRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    artistName: string;
    artistId: number;
    userId: string;
    alreadyRated: boolean;
    checkingRating: boolean;
}

export default function QuadrantRating({
    onSubmit,
    artistName,
    artistId,
    userId,
    alreadyRated,
    checkingRating,
}: QuadrantRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);
    const [timeRemaining, setTimeRemaining] = useState(15);
    const [hasMovedSliders, setHasMovedSliders] = useState(false);

    useEffect(() => {
        if (timeRemaining > 0 && !alreadyRated) {
            const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeRemaining, alreadyRated]);

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
            <div className="flex flex-col justify-center items-center h-full text-white">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-gray-400 mb-6">Loading...</p>
            </div>
        );
    }

    if (alreadyRated) {
        return (
            <div className="flex flex-col justify-center items-center h-full text-white">
                <h3 className="text-lg font-semibold mb-2">Rate {artistName}</h3>
                <p className="text-sm text-gray-400 mb-6">Already rated!</p>
                <Button
                    className="mt-6 w-full bg-gradient-to-r from-pink-500 to-green-400 text-black font-bold rounded-xl"
                    disabled
                >
                    ALREADY RATED
                </Button>
            </div>
        );
    }

    const canSubmit = timeRemaining <= 0 && hasMovedSliders;
    const isTimerActive = timeRemaining > 0;

    return (
        <div className="flex flex-col h-full p-4 bg-black rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-2 text-white text-center">
                Rate {artistName}
            </h3>
            <p className="text-sm text-gray-400 mb-6 text-center">
                Rate this artist to earn <span className="text-gradient">10 points!</span>
            </p>

            <div className="space-y-8">
                {/* Ticket Interest */}
                <div>
                    <label className="text-sm font-medium text-white">
                        How likely are you to buy a ticket?
                    </label>
                    <Slider
                        value={[ticketInterest]}
                        onValueChange={handleTicketChange}
                        disabled={isTimerActive}
                        className={clsx(
                            "my-4",
                            "[&_.track]:bg-gradient-to-r [&_.track]:from-purple-400 [&_.track]:to-green-400",
                            "[&_.thumb]:bg-white [&_.thumb]:border-2 [&_.thumb]:border-pink-500"
                        )}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Not Likely</span>
                        <span>Very Likely</span>
                    </div>
                </div>

                {/* Share Interest */}
                <div>
                    <label className="text-sm font-medium text-white">
                        How likely are you to share with a friend?
                    </label>
                    <Slider
                        value={[shareInterest]}
                        onValueChange={handleShareChange}
                        disabled={isTimerActive}
                        className={clsx(
                            "my-4",
                            "[&_.track]:bg-gradient-to-r [&_.track]:from-yellow-400 [&_.track]:to-pink-500",
                            "[&_.thumb]:bg-white [&_.thumb]:border-2 [&_.thumb]:border-green-400"
                        )}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Not Likely</span>
                        <span>Very Likely</span>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                className={clsx(
                    "mt-8 w-full py-3 rounded-xl font-bold transition",
                    canSubmit
                        ? "bg-gradient-to-r from-pink-500 via-yellow-400 to-green-400 text-black"
                        : "bg-gray-700 text-gray-400"
                )}
                disabled={!canSubmit}
            >
                {isTimerActive && <Timer className="w-4 h-4 mr-2" />}
                {isTimerActive
                    ? `Watch video for ${timeRemaining}s`
                    : canSubmit
                        ? "Submit Rating"
                        : "Move sliders to submit"}
            </Button>
        </div>
    );
}
