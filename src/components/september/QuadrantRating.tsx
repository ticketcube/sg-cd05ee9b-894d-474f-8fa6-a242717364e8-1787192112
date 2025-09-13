
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
    checkingRating,
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
                setWatchTime((prev) => Math.min(prev + 1, minWatchTime));
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

    const handleSubmit = async () => {
        if (alreadyRated || isSubmitting || !slidersChanged || watchTime < minWatchTime) return;

        setIsSubmitting(true);

        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;

        try {
            await onSubmit({ x, y });
            setHasEarnedPoints(true);
        } catch (error) {
            console.error("Rating submission failed:", error);
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
        <div className="flex flex-col flex-1 min-h-0 bg-black">
            {/* Header */}
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
                {(hasEarnedPoints || !isEligibleForPoints) && (
                    <div className="flex justify-center mb-4">
                        {!isEligibleForPoints ? (
                            <div className="bg-purple-lit px-3 py-2 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-lg text-white font-medium">
                                    Already rated
                                </span>
                            </div>
                        ) : hasEarnedPoints ? (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Star className="w-4 h-4 text-white" />
                                <span className="text-sm text-white font-bold">
                                    {videoPoints} points earned!
                                </span>
                            </motion.div>
                        ) : null}
                    </div>
                )}

                <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-center text-white mb-2">
                    {artistName}
                </h3>
            </div>

            {/* Sliders */}
            <div className="flex-1 min-h-0 flex flex-col justify-between">
                {/* ... your sliders code remains unchanged ... */}
            </div>

            {/* Footer Submit Button */}
            <div className="p-4 lg:p-6 bg-black border-t border-gray-700 flex-shrink-0">
                {(() => {
                    let buttonColor = "";
                    let hoverColor = "";
                    let extraEffect = "";
                    let isDisabled =
                        isSubmitting || userHasVoted || !slidersChanged || watchTime < minWatchTime;

                    if (userHasVoted) {
                        buttonColor = "bg-purple-deep";
                        hoverColor = "hover:bg-purple-deep";
                    } else if (watchTime < minWatchTime) {
                        buttonColor = "bg-purple-med";
                        hoverColor = "hover:bg-purple-deep";
                    } else if (slidersChanged) {
                        buttonColor = "bg-purple-lit";
                        hoverColor = "hover:bg-purple-med";
                        extraEffect = "animate-pulse";
                    }

                    return (
                        <Button
                            onClick={handleSubmit}
                            className={`w-full ${buttonColor} ${hoverColor} ${extraEffect} text-lg font-bold transition-all duration-300 relative overflow-hidden ${isDisabled
                                    ? "text-gray-400 cursor-not-allowed opacity-70"
                                    : "text-white shadow-lg"
                                }`}
                            disabled={isDisabled}
                        >
                            {!userHasVoted && watchTime < minWatchTime && (
                                <div
                                    className="absolute top-0 left-0 h-1 bg-blue-400 transition-all duration-1000 ease-out"
                                    style={{ width: `${(watchTime / minWatchTime) * 100}%` }}
                                />
                            )}

                            <div className="flex items-center justify-center gap-2 py-2">
                                {!userHasVoted && watchTime < minWatchTime && (
                                    <Timer className="w-4 h-4 text-white" />
                                )}

                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}

                                <span>
                                    {isSubmitting
                                        ? "Submitting Rating..."
                                        : userHasVoted
                                            ? "You've Already Rated This Artist"
                                            : watchTime < minWatchTime
                                                ? `Watch ${minWatchTime - watchTime}s More to Submit`
                                                : !slidersChanged
                                                    ? "Adjust Sliders to Submit Rating"
                                                    : `Submit Rating & Earn ${videoPoints} Points`}
                                </span>

                                {!userHasVoted && watchTime < minWatchTime && (
                                    <span className="text-xs bg-blue-600 px-2 py-1 rounded-full ml-1">
                                        {watchTime}/{minWatchTime}s
                                    </span>
                                )}
                            </div>
                        </Button>
                    );
                })()}
            </div>
        </div> // ✅ now properly closed
    );
}
