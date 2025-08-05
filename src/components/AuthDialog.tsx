import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
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
  title = "Register for Rewards",
  description = "Create your profile to earn discovery rewards!"
}: AuthDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [customCity, setCustomCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleCityChange = (city: City | null, customInput?: string) => {
    setSelectedCity(city);
    setCustomCity(customInput || "");
  };

  const handleLogin = async () => {
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
      await login(username.trim(), email.trim(), cityName);
      
      // Clear form
      setUsername("");
      setEmail("");
      setSelectedCity(null);
      setCustomCity("");
      
      // Close dialog if onClose is provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            onClick={handleLogin} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Register & Continue
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
