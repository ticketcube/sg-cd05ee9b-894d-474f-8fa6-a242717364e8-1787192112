
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 [AuthCallback] Starting OAuth callback processing');
        
        // ✅ ENHANCED: More comprehensive session handling
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [AuthCallback] Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (!sessionData.session || !sessionData.session.user) {
          console.error('❌ [AuthCallback] No session found, checking URL params');
          
          // ✅ NEW: Handle URL hash fragments for OAuth
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const urlParams = new URLSearchParams(window.location.search);
          
          if (hashParams.get('access_token') || urlParams.get('code')) {
            console.log('🔄 [AuthCallback] OAuth params found, waiting for session...');
            // Wait a bit longer for session to be established
            setTimeout(handleAuthCallback, 1000);
            return;
          }
          
          setError('No authentication session found.');
          return;
        }

        const user = sessionData.session.user;
        console.log('✅ [AuthCallback] OAuth user authenticated:', user.id);

        // ✅ ENHANCED: Check if user has a complete profile before redirecting
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, username')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ [AuthCallback] Error checking profile:', profileError);
          setError('Error checking your profile. Please try again.');
          return;
        }

        // ✅ NEW: Store OAuth user data for profile setup if needed
        const oauthUserData = {
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || ''
        };

        if (!profileData || !profileData.username) {
          // ✅ NEW USER FLOW: No profile exists, redirect to profile setup
          console.log('🔄 [AuthCallback] New user, redirecting to profile setup');
          
          // Store OAuth data for profile setup page
          sessionStorage.setItem('oauth_user_data', JSON.stringify(oauthUserData));
          await router.replace('/auth/setup-profile');
          return;
        }

        // ✅ EXISTING USER FLOW: Profile exists, go to dashboard
        console.log('✅ [AuthCallback] Existing user with profile, redirecting to dashboard');

        // ✅ CRITICAL: Add a flag to prevent index page interference
        sessionStorage.setItem('oauth_redirect_in_progress', 'true');

        // ✅ ENHANCED: Force immediate redirect with replace to prevent back button issues
        console.log('🚀 [AuthCallback] Redirecting to discovery dashboard');
        await router.replace('/discovery-dashboard');
        
        // Clear the flag after successful redirect
        setTimeout(() => {
          sessionStorage.removeItem('oauth_redirect_in_progress');
        }, 2000);

      } catch (error) {
        console.error('❌ [AuthCallback] Error in auth callback:', error);
        setError('Something went wrong. Please try signing in again.');
      } finally {
        setLoading(false);
      }
    };

    // ✅ ENHANCED: Immediate processing with fallback
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