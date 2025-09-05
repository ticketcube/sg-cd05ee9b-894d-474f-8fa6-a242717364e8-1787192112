import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import userProfileService from "@/services/userProfileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User } from "lucide-react";

interface OAuthUserData {
  email: string;
  name: string;
  avatar_url: string;
}

export default function SetupProfile() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [userData, setUserData] = useState<OAuthUserData | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    // Get OAuth user data from sessionStorage
    const storedData = sessionStorage.getItem('oauth_user_data');
    if (!storedData) {
      // No OAuth data found, redirect to home
      router.replace('/');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData);
      
      // Suggest username from name or email
      const suggestedUsername = parsedData.name 
        ? parsedData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
        : parsedData.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      
      setUsername(suggestedUsername);
    } catch (error) {
      console.error('Error parsing OAuth user data:', error);
      router.replace('/');
    }
  }, [router]);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim()) {
      setUsernameError(null);
      return;
    }

    const validation = authService.validateUsername(usernameToCheck);
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Invalid username');
      return;
    }

    setIsCheckingUsername(true);
    try {
      const exists = await authService.checkUsernameExists(usernameToCheck);
      if (exists) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Unable to check username availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Debounce username checking
    if (value.trim()) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      setError('Missing user data. Please try signing in again.');
      return;
    }

    if (usernameError || !username.trim()) {
      setError('Please choose a valid username');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Create user profile
      const profileData = {
        user_id: user.id,
        email: userData.email,
        username: username.trim(),
        avatar_url: userData.avatar_url || null,
        total_points: 0,
        role: null
      };

      await userProfileService.createUserProfile(profileData);

      // Clear OAuth data from session storage
      sessionStorage.removeItem('oauth_user_data');

      // ✅ FIXED: Redirect to dashboard instead of index
      console.log('✅ [ProfileSetup] Profile created, redirecting to dashboard');
      router.replace('/discovery-dashboard');

    } catch (error) {
      console.error('Error creating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Complete Your Profile</h1>
              <p className="text-neutral-600">Choose a username to get started</p>
            </div>
          </div>

          {/* User Info Display */}
          <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-3">
              {userData.avatar_url && (
                <img 
                  src={userData.avatar_url} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-neutral-900">{userData.name}</p>
                <p className="text-sm text-neutral-600">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Username Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-neutral-700 font-medium">
                Choose Your Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter username"
                className={`${usernameError ? 'border-red-300 focus:border-red-500' : 'border-neutral-200'}`}
                disabled={isLoading}
              />
              {isCheckingUsername && (
                <p className="text-sm text-neutral-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin" />
                  Checking availability...
                </p>
              )}
              {usernameError && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {usernameError}
                </p>
              )}
              {!usernameError && username.trim() && !isCheckingUsername && (
                <p className="text-sm text-green-600">✓ Username is available</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !!usernameError || !username.trim() || isCheckingUsername}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Profile...
                </div>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}