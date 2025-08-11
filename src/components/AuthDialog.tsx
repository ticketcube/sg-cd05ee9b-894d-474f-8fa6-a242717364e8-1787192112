
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
  title = "Sign In or Create Account",
  description = "Create your profile to unlock TicketCube features!"
}: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [customCity, setCustomCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleCityChange = (city: City | null, customInput?: string) => {
    setSelectedCity(city);
    setCustomCity(customInput || "");
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (!selectedCity && !customCity.trim()) {
      alert("Please select or enter your city");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const cityName = selectedCity ? selectedCity.normalized_name : customCity.trim();
      
      // Create account with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim()
      });

      if (signUpError) {
        console.error("Supabase sign-up error:", signUpError);
        throw new Error(signUpError.message || "Failed to create account. Please try again.");
      }

      if (authData.user) {
        // Create user profile
        await login(username.trim(), email.trim(), cityName);
        
        if (onClose) {
          onClose();
        }
      }
      
    } catch (error) {
      console.error("Sign-up error:", error);
      alert(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // Sign in with Supabase
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) {
        console.error("Supabase sign-in error:", signInError);
        throw new Error(signInError.message || "Failed to sign in. Please check your credentials.");
      }

      if (authData.user) {
        // The AuthContext will handle loading the user profile
        if (onClose) {
          onClose();
        }
      }
      
    } catch (error) {
      console.error("Sign-in error:", error);
      alert(error instanceof Error ? error.message : "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
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
            {isSignUp ? "Create Account" : "Sign In"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {description && (
            <div className="text-center">
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          )}
          
          {isSignUp && (
            <div className="text-center">
              <div className="text-sm text-gray-500 space-y-2 mb-4">
                <div>• Create custom TicketCubes</div>
                <div>• Secure and mint your cubes</div>
                <div>• Share cubes with friends</div>
                <div>• Access exclusive features</div>
              </div>
            </div>
          )}
          
          {/* Authentication Form */}
          <div className="space-y-3">
            {isSignUp && (
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
            )}
            
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
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full text-black placeholder:text-gray-500"
                disabled={loading}
              />
            </div>
            
            {isSignUp && (
              <div>
                <SimpleCityInput
                  value={selectedCity}
                  onValueChange={handleCityChange}
                  placeholder="Enter your city..."
                />
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              <>
                {isSignUp ? (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </>
            )}
          </Button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
              disabled={loading}
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "Need an account? Create Account"
              }
            </button>
          </div>
          
          <div className="text-xs text-center text-gray-500">
            {isSignUp 
              ? "Your account will be created instantly - no email confirmation needed!"
              : "Sign in with your email and password"
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
