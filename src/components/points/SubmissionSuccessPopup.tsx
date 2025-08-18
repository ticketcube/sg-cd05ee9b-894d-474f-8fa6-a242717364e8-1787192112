import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Star, Trophy } from "lucide-react";
import type { SubmissionResult } from "@/services/weeklyVotingService";

interface SubmissionSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  result: SubmissionResult | null;
}

export default function SubmissionSuccessPopup({
  isOpen,
  onClose,
  result,
}: SubmissionSuccessPopupProps) {
  console.log("🎭 SubmissionSuccessPopup render - isOpen:", isOpen, "result:", result);
  
  if (!result) {
    console.log("⚠️ SubmissionSuccessPopup: No result provided, returning null");
    return null;
  }

  const { totalPointsEarned, breakdown } = result;
  console.log("📊 SubmissionSuccessPopup: Using data - totalPointsEarned:", totalPointsEarned, "breakdown:", breakdown);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
            <BadgeCheck className="h-8 w-8" />
            Ratings Submitted!
          </DialogTitle>
        </DialogHeader>

        <div className="my-6 text-center">
          <p className="text-gray-400">You've earned</p>
          <p className="text-5xl font-bold text-white my-2">
            {totalPointsEarned}
          </p>
          <p className="text-gray-400">points!</p>
        </div>

        <div className="space-y-4 my-6">
          <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <p>Artists Rated</p>
            </div>
            <p className="font-bold text-white">
              {breakdown.ratings.points > 0 ? `+${breakdown.ratings.points} pts` : '0 pts'}
            </p>
          </div>
          {breakdown.ratings.count > 0 && (
             <p className="text-xs text-gray-500 text-right -mt-2 pr-3">
                {breakdown.ratings.count} artist{breakdown.ratings.count > 1 ? 's' : ''} x {breakdown.ratings.pointsPerRating} pts
            </p>
          )}

          {breakdown.completionBonus.points > 0 && (
            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-purple-400" />
                <p>Completion Bonus</p>
              </div>
              <p className="font-bold text-white">
                +{breakdown.completionBonus.points} pts
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}