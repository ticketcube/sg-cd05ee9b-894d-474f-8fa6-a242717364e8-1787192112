import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { userProfileService } from "@/services/userProfileService";

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (!data.session || !data.session.user) {
          setError('No authentication session found.');
          return;
        }

        const user = data.session.user;
        console.log('OAuth user:', user);

        // Check if user already has a profile
        try {
          const existingProfile = await userProfileService.getUserProfile(user.id);
          
          if (existingProfile) {
            // User has existing profile, redirect to home
            router.replace('/');
            return;
          }
        } catch (profileError) {
          // Profile doesn't exist or error occurred, continue with profile creation
          console.log('No existing profile found, creating new one');
        }

        // New user - redirect to profile setup with user data
        const userData = {
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
        };

        // Store user data in sessionStorage for profile setup
        sessionStorage.setItem('oauth_user_data', JSON.stringify(userData));
        
        // Redirect to profile setup
        router.replace('/auth/setup-profile');

      } catch (error) {
        console.error('Error in auth callback:', error);
        setError('Something went wrong. Please try signing in again.');
      } finally {
        setLoading(false);
      }
    };

    // Handle the callback on mount
    handleAuthCallback();
  }, [router]);

  const handleRetryAuth = () => {
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-neutral-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Authentication Error</h2>
              <p className="text-neutral-600">{error}</p>
            </div>
            <button
              onClick={handleRetryAuth}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}