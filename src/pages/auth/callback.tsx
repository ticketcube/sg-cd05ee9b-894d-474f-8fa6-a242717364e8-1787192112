
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import userProfileService from "@/services/userProfileService";

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 [AuthCallback] Starting OAuth callback processing');
        
        // Handle the OAuth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('❌ [AuthCallback] Auth callback error:', authError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (!data.session || !data.session.user) {
          console.error('❌ [AuthCallback] No authentication session found');
          setError('No authentication session found.');
          return;
        }

        const user = data.session.user;
        console.log('✅ [AuthCallback] OAuth user authenticated:', user.id);

        // Wait a moment for the auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user already has a profile
        try {
          console.log('🔍 [AuthCallback] Checking for existing profile...');
          const existingProfile = await userProfileService.getUserProfile(user.id);
          
          if (existingProfile) {
            // ✅ FIXED: Redirect existing users to discovery dashboard directly
            console.log('✅ [AuthCallback] Existing profile found, redirecting to dashboard');
            router.replace('/discovery-dashboard');
            return;
          }
        } catch (profileError: any) {
          // Profile doesn't exist or error occurred, continue with profile creation
          console.log('⚠️ [AuthCallback] No existing profile found, proceeding to setup:', profileError?.message);
        }

        // New user - redirect to profile setup with user data
        const userData = {
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
        };

        console.log('🆕 [AuthCallback] New user, storing OAuth data for profile setup');
        
        // Store user data in sessionStorage for profile setup
        sessionStorage.setItem('oauth_user_data', JSON.stringify(userData));
        
        // Redirect to profile setup
        router.replace('/auth/setup-profile');

      } catch (error) {
        console.error('❌ [AuthCallback] Error in auth callback:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">Completing sign in...</p>
            <p className="text-gray-400 text-sm">Setting up your account</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center space-y-6 border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Authentication Error</h2>
              <p className="text-gray-300">{error}</p>
            </div>
            <button
              onClick={handleRetryAuth}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
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
