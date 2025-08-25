
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, User, Mail, MapPin, CheckCircle } from "lucide-react";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProfileSetupModal({ isOpen, onClose, onSuccess }: ProfileSetupModalProps) {
  const { user, supabaseUser, login } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || supabaseUser?.email?.split('@')[0] || '',
    email: user?.email || supabaseUser?.email || '',
    city: user?.city || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      setError("Username and email are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔧 Starting profile setup with form data:", formData);
      
      await login(
        formData.username.trim(),
        formData.email.trim(),
        formData.city.trim() || undefined
      );
      
      console.log("✅ Profile setup completed successfully");
      setSuccess(true);
      
      // Wait a moment for the database transaction to complete
      setTimeout(() => {
        console.log("🔄 Triggering success callback/reload after profile creation");
        
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback: close modal and refresh page
          onClose();
          window.location.reload();
        }
      }, 1500); // 1.5 second delay to ensure DB consistency
      
    } catch (error) {
      console.error("❌ Profile setup failed:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to complete profile setup";
      if (error instanceof Error) {
        if (error.message.includes('Profile not found')) {
          errorMessage = "There was an issue creating your profile. Please try again.";
        } else if (error.message.includes('authentication')) {
          errorMessage = "Authentication error. Please sign in again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && !success && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            We need a few details to set up your OnesToWatch profile and start earning points.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Profile Created Successfully!</h3>
            <p className="text-gray-400">Redirecting you to your dashboard...</p>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                className="bg-gray-800 border-gray-600 text-white"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="bg-gray-800 border-gray-600 text-white"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City (Optional)
              </Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter your city"
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating profile...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
