import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Ticket, Users, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmbedVoteRatingProps {
    onSubmit: (data: { x: number; y: number }) => void;
    artistName: string;
    isSubmitting?: boolean;
    alreadyVoted?: boolean;
    videoWatchTime: number;
    minWatchTime?: number;
}

export function EmbedVoteRating({
    onSubmit,
    artistName,
    isSubmitting = false,
    alreadyVoted = false,
    videoWatchTime,
    minWatchTime = 10
}: EmbedVoteRatingProps) {
    const [ticketInterest, setTicketInterest] = useState(50);
    const [shareInterest, setShareInterest] = useState(50);
    const [slidersChanged, setSlidersChanged] = useState(false);

    const canSubmit = !alreadyVoted && !isSubmitting && slidersChanged && videoWatchTime >= minWatchTime;

    const handleTicketInterestChange = (value: number[]) => {
        if (alreadyVoted) return;
        setTicketInterest(value[0]);
        setSlidersChanged(true);
    };

    const handleShareInterestChange = (value: number[]) => {
        if (alreadyVoted) return;
        setShareInterest(value[0]);
        setSlidersChanged(true);
    };

    const getTicketLabel = (value: number) => {
        if (value <= 20) return 'Not For Me';
        if (value <= 40) return 'Maybe';
        if (value <= 60) return 'Interested';
        if (value <= 80) return 'Likely';
        return "I'd Buy Tickets";
    };

    const getShareLabel = (value: number) => {
        if (value <= 20) return 'Not For Them';
        if (value <= 40) return 'Maybe';
        if (value <= 60) return 'Worth Sharing';
        if (value <= 80) return "I'd Recommend";
        return "I'd Tell Friends";
    };

    const handleSubmit = () => {
        if (!canSubmit) return;

        const x = (shareInterest - 50) / 50;
        const y = (ticketInterest - 50) / 50;

        onSubmit({ x, y });
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
            {/* Header - More compact */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white text-center">
                    Rate {artistName}
                </h3>
            </div>

            {/* Rating Controls - More compact spacing */}
            <div className="flex-1 space-y-4">
                {/* Ticket Interest Slider */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Ticket className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">Would you buy tickets?</h4>
                    </div>
                    <div className="px-1">
                        <div className="relative mb-2">
                            <div
                                className="absolute inset-0 h-2 rounded-full pointer-events-none z-0"
                                style={{
                                    background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #3b82f6 100%)`,
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <Slider
                                value={[ticketInterest]}
                                onValueChange={handleTicketInterestChange}
                                max={100}
                                step={1}
                                disabled={alreadyVoted}
                                className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-5 [&_[data-radix-slider-thumb]]:h-5 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-gray-900 [&_[data-radix-slider-thumb]]:shadow-lg [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                            <span>Not For Me</span>
                            <span className="font-semibold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {getTicketLabel(ticketInterest)}
                            </span>
                            <span>I'd Buy</span>
                        </div>
                    </div>
                </div>

                {/* Share Interest Slider */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500/20 rounded-lg">
                            <Users className="w-4 h-4 text-green-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-white">Would you share with friends?</h4>
                    </div>
                    <div className="px-1">
                        <div className="relative mb-2">
                            <div
                                className="absolute inset-0 h-2 rounded-full pointer-events-none z-0"
                                style={{
                                    background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #3b82f6 100%)`,
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <Slider
                                value={[shareInterest]}
                                onValueChange={handleShareInterestChange}
                                max={100}
                                step={1}
                                disabled={alreadyVoted}
                                className="w-full relative z-10 [&_[data-radix-slider-track]]:bg-transparent [&_[data-radix-slider-thumb]]:w-5 [&_[data-radix-slider-thumb]]:h-5 [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:border-2 [&_[data-radix-slider-thumb]]:border-gray-900 [&_[data-radix-slider-thumb]]:shadow-lg [&_[data-radix-slider-thumb]]:cursor-pointer hover:[&_[data-radix-slider-thumb]]:scale-110 [&_[data-radix-slider-thumb]]:transition-transform"
                            />
                        </div>
                        <div className="flex justify-between text-xs text-white/90">
                            <span>Not For Them</span>
                            <span className="font-semibold text-white bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                {getShareLabel(shareInterest)}
                            </span>
                            <span>I'd Share</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button - Reduced top margin */}
            <div className="mt-2">
                {alreadyVoted ? (
                    <div className="bg-green-600/20 border border-green-500 rounded-lg p-3 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white font-semibold">You've rated this artist!</span>
                    </div>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`
                            w-full py-5 text-base font-bold rounded-lg transition-all duration-300
                            ${canSubmit
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                                : 'bg-gray-600/50 text-white/60 cursor-not-allowed'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Submitting...</span>
                            </div>
                        ) : videoWatchTime < minWatchTime ? (
                            <span>Watch {minWatchTime - videoWatchTime}s more to rate</span>
                        ) : !slidersChanged ? (
                            <span>Move sliders to submit your rating</span>
                        ) : (
                            <span>Submit Rating</span>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}