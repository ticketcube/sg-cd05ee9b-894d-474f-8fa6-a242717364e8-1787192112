
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, CheckCircle, Ticket, Users, Loader2, Star } from 'lucide-react';
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
            <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Checking Rating Status
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Loading your rating for {artistName}...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-purple-deep">
            {/* Mobile/Desktop Combined Header - Now Clean and Focused */}
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
                {/* Points Status Display - Only Success States */}
                {(hasEarnedPoints || !isEligibleForPoints) && (
                    <div className="flex justify-center mb-4">
                        {!isEligibleForPoints ? (
                            <div className="bg-gray-800 px-3 py-2 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400 font-medium">Already rated</span>
                            </div>
                        ) : hasEarnedPoints ? (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Star className="w-4 h-4 text-white" />
                                <span className="text-sm text-white font-bold">{videoPoints} points earned!</span>
                            </motion.div>
                        ) : null}
                    </div>
                )}

                {/* Artist Name - Now Bigger and More Prominent */}
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-center text-white mb-2">
                    {artistName}
                </h3>
                <p className="text-center text-gray-400 text-sm lg:text-base">
                    Watch & Rate = 10 Points
                </p>
            </div>

            {/* Rating Controls */}
            <div className="flex-1 min-h-0 flex flex-col justify-between">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 lg:space-y-8"
                    >
                        {/* Ticket Interest Slider */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Ticket className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm lg:text-base font-semibold text-white">Concert Interest</h4>
                                    <p className="text-xs text-gray-400">How likely to buy tickets?</p>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="relative mb-3">
                                    <div
                                        className="absolute inset-0 h-4 rounded-full pointer-events-none z-0"
                                        style={{
                                            background: `linear-gradient(to right, #ef4444 0%, #f97316 15%, #eab308 30%, #84cc16 45%, #22c55e 60%, #06b6d4 75%, #3b82f6 90%, #8b5cf6 100%)`,
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
                                        className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-8 [&_[data-radix-slider-thumb]]:h-8 lg:[&_[data-radix-slider-thumb]]:w-10 lg:[&_[data-radix-slider-thumb]]:h-10 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-900 [&_[data-radix-slider-thumb]]:shadow-2xl [&_[data-radix-slider-thumb]]:shadow-purple-500/30 [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-125 [&_[data-radix-slider-thumb]]:transition-all [&_[data-radix-slider-thumb]]:duration-200 [&_[data-radix-slider-thumb]]:z-20"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Not For Me</span>
                                    <span className="font-semibold text-white bg-gray-800 px-2 py-1 rounded text-xs">
                                        {getTicketLabel(ticketInterest)}
                                    </span>
                                    <span>I'd Buy Tickets</span>
                                </div>
                            </div>
                        </div>

                        {/* Share Interest Slider */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm lg:text-base font-semibold text-white">Sharing Interest</h4>
                                    <p className="text-xs text-gray-400">Would you recommend this?</p>
                                </div>
                            </div>
                            <div className="px-2">
                                <div className="relative mb-3">
                                    <div
                                        className="absolute inset-0 h-4 rounded-full pointer-events-none z-0"
                                        style={{
                                            background: `linear-gradient(to right, #ef4444 0%, #f97316 15%, #eab308 30%, #84cc16 45%, #22c55e 60%, #06b6d4 75%, #3b82f6 90%, #8b5cf6 100%)`,
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
                                        className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-8 [&_[data-radix-slider-thumb]]:h-8 lg:[&_[data-radix-slider-thumb]]:w-10 lg:[&_[data-radix-slider-thumb]]:h-10 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-3 [&_[data-radix-slider-thumb]]:border-gray-900 [&_[data-radix-slider-thumb]]:shadow-2xl [&_[data-radix-slider-thumb]]:shadow-blue-500/30 [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-125 [&_[data-radix-slider-thumb]]:transition-all [&_[data-radix-slider-thumb]]:duration-200 [&_[data-radix-slider-thumb]]:z-20"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Not For Them</span>
                                    <span className="font-semibold text-white bg-gray-800 px-2 py-1 rounded text-xs">
                                        {getShareLabel(shareInterest)}
                                    </span>
                                    <span>I'd Tell Friends</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer with Submit Button - Now includes Timer */}
            <div className="p-4 lg:p-6 bg-gray-800/50 border-t border-gray-700 flex-shrink-0">
                <Button
                    onClick={handleSubmit}
                    className={`w-full text-sm lg:text-base font-bold transition-all duration-300 relative overflow-hidden ${
                        slidersChanged && !userHasVoted && watchTime >= minWatchTime
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg"
                            : "bg-gray-700 hover:bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={isSubmitting || userHasVoted || !slidersChanged || watchTime < minWatchTime}
                >
                    {/* Progress bar for watch time - embedded in button */}
                    {!userHasVoted && watchTime < minWatchTime && (
                        <div 
                            className="absolute top-0 left-0 h-1 bg-blue-400 transition-all duration-1000 ease-out"
                            style={{ width: `${(watchTime / minWatchTime) * 100}%` }}
                        />
                    )}
                    
                    <div className="flex items-center justify-center gap-2 py-2">
                        {/* Timer icon when counting down */}
                        {!userHasVoted && watchTime < minWatchTime && (
                            <Timer className="w-4 h-4 text-blue-400" />
                        )}
                        
                        {/* Spinner when submitting */}
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        
                        {/* Button text with countdown */}
                        <span>
                            {isSubmitting ? (
                                "Submitting Rating..."
                            ) : userHasVoted ? (
                                "You've Already Rated This Artist"
                            ) : watchTime < minWatchTime ? (
                                `Watch ${minWatchTime - watchTime}s More to Submit`
                            ) : !slidersChanged ? (
                                "Adjust Sliders to Submit Rating"
                            ) : (
                                `Submit Rating & Earn ${videoPoints} Points`
                            )}
                        </span>

                        {/* Watch progress indicator in button */}
                        {!userHasVoted && watchTime < minWatchTime && (
                            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full ml-1">
                                {watchTime}/{minWatchTime}s
                            </span>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
}