
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  title = "Register for Rewards",
  description = "Create your profile to earn discovery rewards!"
}: AuthDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [customCity, setCustomCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleCityChange = (city: City | null, customInput?: string) => {
    setSelectedCity(city);
    setCustomCity(customInput || "");
  };

  const handleSendMagicLink = async () => {
    if (!username.trim() || !email.trim()) {
      alert("Please enter username and email");
      return;
    }

    if (!selectedCity && !customCity.trim()) {
      alert("Please select or enter your city");
      return;
    }

    setLoading(true);
    try {
      const cityName = selectedCity ? selectedCity.normalized_name : customCity.trim();
      
      // Store user data in localStorage temporarily so we can complete profile after auth
      const tempUserData = {
        username: username.trim(),
        email: email.trim(),
        city: cityName
      };
      localStorage.setItem("temp_auth_data", JSON.stringify(tempUserData));
      
      // Send magic link
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (signInError) {
        console.error("Supabase sign-in error:", signInError);
        throw new Error("Failed to send magic link. Please try again.");
      }

      setEmailSent(true);
      
    } catch (error) {
      console.error("Authentication error:", error);
      alert(error instanceof Error ? error.message : "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !emailSent) {
      handleSendMagicLink();
    }
  };

  const handleClose = () => {
    // Reset states when closing
    setEmailSent(false);
    setUsername("");
    setEmail("");
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
            {emailSent ? "Check Your Email" : title}
          </DialogTitle>
        </DialogHeader>
        
        {!emailSent ? (
          <div className="space-y-4">
            {description && (
              <div className="text-center">
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-sm text-gray-500 space-y-2 mb-4">
                <div>• Get personalized local events</div>
                <div>• Earn points for engaging with content</div>
                <div>• Vote on your favorite artists</div>
                <div>• Unlock exclusive features</div>
              </div>
            </div>
            
            {/* Login Form */}
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-black placeholder:text-gray-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full text-black placeholder:text-gray-500"
                  disabled={loading}
                />
              </div>
              <div>
                <SimpleCityInput
                  value={selectedCity}
                  onValueChange={handleCityChange}
                  placeholder="Enter your city..."
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSendMagicLink} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
            
            <div className="text-xs text-center text-gray-500">
              We'll send you a magic link to complete sign-in
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Magic Link Sent!</h3>
              <p className="text-sm text-gray-600">
                We've sent a magic link to <strong>{email}</strong>
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                Click the link in your email to complete sign-in. Your profile will be automatically created with your information.
              </p>
            </div>
            
            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
            
            <div className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
