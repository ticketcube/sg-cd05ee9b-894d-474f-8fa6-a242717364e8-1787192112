
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export default function AuthDialog({ 
  isOpen, 
  onClose, 
  title = "Login Required",
  description = "Please log in to access this content"
}: AuthDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !email.trim()) {
      alert("Please enter both username and email");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), email.trim());
      
      // Clear form
      setUsername("");
      setEmail("");
      
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
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
                className="w-full"
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
                className="w-full"
                disabled={loading}
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
                Logging in...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Login & Continue
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
