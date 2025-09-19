import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface QuadrantRatingSuccessPopupProps {
  show: boolean;
  onClose: () => void;
  pointsEarned: number;
  artistName: string;
}

export function QuadrantRatingSuccessPopup({ 
  show, 
  onClose, 
  pointsEarned, 
  artistName 
}: QuadrantRatingSuccessPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="bg-white border-0 shadow-2xl">
              <CardContent className="p-6 text-center">
                {/* Success Icon with Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="mb-4 flex justify-center"
                >
                  <div className="bg-green-500 rounded-full p-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Points Earned */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Congratulations!
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-3xl font-bold text-green-600">
                      +{pointsEarned}
                    </span>
                    <span className="text-lg text-gray-600">points</span>
                  </div>
                  <p className="text-gray-600 mb-6">
                    You've successfully rated <span className="font-semibold text-[hsl(279,92%,25%)]">{artistName}</span>!
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  {/* Discover More Button */}
                  <Link href="/september/rewards" className="block">
                    <Button 
                      className="w-full bg-[hsl(279,92%,25%)] hover:bg-[hsl(279,92%,20%)] text-white"
                      onClick={onClose}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Discover More Artists
                    </Button>
                  </Link>

                  {/* View Rewards Button */}
                  <Link href="/discovery-dashboard" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full border-[hsl(279,92%,25%)] text-[hsl(279,92%,25%)] hover:bg-[hsl(279,92%,25%)] hover:text-white"
                      onClick={onClose}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Rewards Dashboard
                    </Button>
                  </Link>
                </motion.div>

                {/* Small close text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-gray-500 mt-4 cursor-pointer hover:text-gray-700"
                  onClick={onClose}
                >
                  Click anywhere to close
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
