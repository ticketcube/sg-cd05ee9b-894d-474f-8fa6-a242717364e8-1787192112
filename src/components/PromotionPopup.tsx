
import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserProfile } from "@/contexts/UserProfileContext";

interface PromotionPopupProps {
  onRegisterClick: () => void;
}

export default function PromotionPopup({ onRegisterClick }: PromotionPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUserProfile();

  // Prevent hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || user) {
      setIsOpen(false);
      return;
    }

    // Safe to access localStorage after mount
    const hasSeenPromo = localStorage.getItem('otwchart-promo-seen');
    if (!hasSeenPromo) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, mounted]);

  const handleClose = () => {
    setIsOpen(false);
    if (mounted) {
      localStorage.setItem('otwchart-promo-seen', 'true');
    }
  };

  const handleRegisterClick = () => {
    handleClose();
    onRegisterClick();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Limited Time Offer! 🎵
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Register now and complete one discovery activity to enter a drawing for {" "}
            <span className="font-bold text-primary">2 FREE tickets</span> to upcoming shows!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleRegisterClick}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
          >
            Register Now & Get Free Tickets! 🎫
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-full text-sm text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>

        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}