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

  const { pointsEarned, message } = result;
  

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
            {pointsEarned || 0}
          </p>
          <p className="text-gray-400">points!</p>
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