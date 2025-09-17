import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Loader2, User, Mail, MapPin, CheckCircle } from "lucide-react";

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProfileSetupModal({ isOpen, onClose, onSuccess }: ProfileSetupModalProps) {
  const { user, profile, refreshProfile } = useUserProfile();
  
  const [formData, setFormData] = useState({
    username: profile?.username || user?.email?.split('@')[0] || '',
    email: profile?.email || user?.email || '',
    city: profile?.raw_city_input || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('No authenticated user found');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ FIXED: OAuth users get profiles created automatically by database trigger
      // We just need to update the profile with the user's chosen details
      console.log('[ProfileSetupModal] Updating profile via direct Supabase call');
      
      const updateData: any = {
        username: formData.username.trim(),
        email: formData.email.trim()
      };

      // Handle city if provided
      if (formData.city.trim()) {
        updateData.raw_city_input = formData.city.trim();
        
        // Try to find city ID
        const { data: cityData } = await supabase
          .from('city_latlong')
          .select('id')
          .eq('normalized_name', formData.city.trim().toLowerCase())
          .single();
        
        if (cityData) {
          updateData.city_id = cityData.id;
        }
      }
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('[ProfileSetupModal] Error updating profile:', updateError);
        throw new Error(updateError.message);
      }

      if (!updatedProfile) {
        throw new Error('Failed to update profile - profile may not exist yet');
      }

      console.log('✅ [ProfileSetupModal] Profile updated successfully');
      
      setSuccess(true);
      
      // Refresh the profile context
      await refreshProfile();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('[ProfileSetupModal] Error in profile setup:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
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
            <h3 className="text-lg font-semibold text-white mb-2">Profile Updated Successfully!</h3>
            <p className="text-gray-400 mb-4">Setting up your dashboard...</p>
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 mt-4">This will only take a moment</p>
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
                disabled={loading || !formData.username.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating profile...
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