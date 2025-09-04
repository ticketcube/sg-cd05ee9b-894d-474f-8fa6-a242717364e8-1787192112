import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
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

  const { pointsEarned } = result;
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8" />
            Ratings Submitted!
          </DialogTitle>
        </DialogHeader>

        <div className="my-6 text-center">
          <p className="text-gray-400">You've earned</p>
          <p className="text-5xl font-bold text-white my-2">
            {pointsEarned}
          </p>
          <p className="text-gray-400">points!</p>
        </div>

        <div className="my-6 text-center">
          <p className="text-gray-400 text-center mb-6">{result.message}</p>

          {breakdown && breakdown.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-white mb-2">Points Breakdown:</h3>
              <ul className="space-y-2">
                {breakdown.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{item.artistName}</span>
                    <span className="font-medium text-green-400">+{item.points} PTS</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {completionBonus > 0 && (
            <div className="text-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <p className="font-semibold text-yellow-400">Completion Bonus: +{completionBonus} PTS!</p>
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