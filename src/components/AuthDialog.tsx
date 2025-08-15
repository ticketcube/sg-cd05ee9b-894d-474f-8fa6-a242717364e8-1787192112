
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SimpleCityInput from "@/components/SimpleCityInput";

interface City {
  id: number;
  name: string;
  normalized_name: string;
  country_code?: string;
  state_code?: string;
}

interface AuthDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export default function AuthDialog({ 
  isOpen, 
  onClose, 
  title = "Sign In or Register",
  description = "Disover Artists, Earn Rewards!"
}: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [customCity, setCustomCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendOtp } = useAuth(); // Changed from login to sendOtp for magic link

  const handleCityChange = (city: City | null, customInput?: string) => {
    setSelectedCity(city);
    setCustomCity(customInput || "");
  };

  const handleAuthAction = async () => {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // For both sign-up and sign-in, we use a magic link (OTP)
      await sendOtp(email.trim());
      alert("Check your email for a magic link to sign in!");
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(error instanceof Error ? error.message : "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAuthAction();
    }
  };

  const handleClose = () => {
    // Reset states when closing
    setUsername("");
    setEmail("");
    setPassword("");
    setSelectedCity(null);
    setCustomCity("");
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm mx-auto bg-white [&>button[aria-label='Close']]:hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-blue-600">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {description && (
            <div className="text-center">
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-sm text-gray-500 space-y-2 mb-4">
              <div>• Earn points for watching videos</div>
              <div>• Vote on your favorite artists</div>
              <div>• Unlock exclusive features</div>
              <div>• Exchange points for Tickets & Access</div>
            </div>
          </div>
          
          {/* Authentication Form */}
          <div className="space-y-3">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full text-black placeholder:text-gray-500"
                disabled={loading}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAuthAction} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Link...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Continue with Email
              </>
            )}
          </Button>
          
          <div className="text-xs text-center text-gray-500">
            We'll send you a magic link to sign in. No password required.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
