import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, Ticket, Users, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
    const [watchTime, setWatchTime] = useState(0);
    const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slidersChanged, setSlidersChanged] = useState(false);
    
    const minWatchTime = 15;
    const videoPoints = 10;
    const isEligibleForPoints = !alreadyRated;

    // Watch timer
    useEffect(() => {
        if (!alreadyRated && watchTime < minWatchTime) {
            const timer = setInterval(() => {
                setWatchTime(prev => Math.min(prev + 1, minWatchTime));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [alreadyRated, watchTime, minWatchTime]);

    const handleTicketInterestChange = (value: number[]) => {
        if (alreadyRated) return;
        setTicketInterest(value[0]);
        setSlidersChanged(true);
    };

    const handleShareInterestChange = (value: number[]) => {
        if (alreadyRated) return;
        setShareInterest(value[0]);
        setSlidersChanged(true);
    };

    const getTicketLabel = (value: number) => {
        if (value <= 20) return 'Not For Me';
        if (value <= 40) return 'Maybe';
        if (value <= 60) return 'Interested';
        if (value <= 80) return 'Likely';
        return 'I\'d Buy Tickets';
    };

    const getShareLabel = (value: number) => {
        if (value <= 20) return 'Not For Them';
        if (value <= 40) return 'Maybe';
        if (value <= 60) return 'Worth Sharing';
        if (value <= 80) return 'I\'d Recommend';
        return 'I\'d Tell Friends';
    };

    const handleSubmit = async () => {
        if (alreadyRated || isSubmitting || !slidersChanged || watchTime < minWatchTime) return;
        
        setIsSubmitting(true);
        
        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;
        
        try {
            await onSubmit({ x, y });
            setHasEarnedPoints(true);
        } catch (error) {
            console.error('Rating submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const userHasVoted = alreadyRated || hasEarnedPoints;

    if (checkingRating) {
        return (
            <div className="p-6 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="flex flex-col justify-center flex-1 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-400 animate-spin" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Loading Rating Status...
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Checking if you've already rated {artistName}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-full flex flex-col">
            <div className="p-6 flex flex-col flex-1">
                {/* Header Section */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white">{artistName}</h2>
                    <p className="text-gray-400 text-sm mt-1">Rate this artist to earn points</p>

                    {/* Timer and Points Display - Centered below artist name */}
                    <div className="flex justify-center mt-3">
                        {!isEligibleForPoints ? (
                            <div className="bg-gray-800 px-3 py-1 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400">Already rated</span>
                            </div>
                        ) : hasEarnedPoints ? (
                            <div className="bg-green-600 px-3 py-1 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-white" />
                                <span className="text-xs text-white font-medium">{videoPoints} points earned!</span>
                            </div>
                        ) : (
                            <div className="bg-gray-800 px-3 py-1 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Timer className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-white">{watchTime}s / {minWatchTime}s</span>
                                </div>
                                <Progress
                                    value={(watchTime / minWatchTime) * 100}
                                    className="w-24 h-1 bg-gray-600"
                                />
                            </div>
                        )}
                    </div>
                </div>

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
                                            <span className="font-medium text-white">{getShareLabel(shareInterest)}</span>
                                            <span>I'd Tell Friends</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer with Submit Button */}
            <div className="p-6 bg-gray-800">
                <Button
                    onClick={handleSubmit}
                    className={`w-full text-lg ${
                        slidersChanged && !userHasVoted && watchTime >= minWatchTime
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-600 hover:bg-gray-600 cursor-not-allowed"
                    }`}
                    disabled={isSubmitting || userHasVoted || !slidersChanged || watchTime < minWatchTime}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : userHasVoted ? (
                        "You've Already Rated This Artist"
                    ) : watchTime < minWatchTime ? (
                        `Watch ${minWatchTime - watchTime} More Seconds`
                    ) : !slidersChanged ? (
                        "Adjust Sliders to Submit Rating"
                    ) : (
                        "Submit Rating"
                    )}
                </Button>
            </div>
        </div>
    );
}