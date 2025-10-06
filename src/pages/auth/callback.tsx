
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
        
        // Check for OAuth tokens in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Handle OAuth errors
        if (errorParam) {
          console.error('❌ [AuthCallback] OAuth error from provider:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setLoading(false);
          return;
        }

        // If we have tokens in the URL hash, Supabase should auto-handle them
        if (accessToken || code) {
          console.log('✅ [AuthCallback] OAuth tokens detected, waiting for session...');
          
          // Wait a moment for Supabase to process the tokens
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Now check for session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ [AuthCallback] Session error:', sessionError);
            setError('Failed to establish session. Please try signing in again.');
            setLoading(false);
            return;
          }

          if (!sessionData.session) {
            console.error('❌ [AuthCallback] No session found after OAuth');
            setError('Authentication incomplete. Please try again.');
            setLoading(false);
            return;
          }

          console.log('✅ [AuthCallback] Session established for user:', sessionData.session.user.id);
          
          // Wait a bit more for the UserProfileContext to process the auth change
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirect to dashboard
          console.log('✅ [AuthCallback] Redirecting to dashboard');
          router.replace('/discovery-dashboard');
          
        } else {
          // No tokens found - might be coming from email link
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData.session) {
            console.log('✅ [AuthCallback] Existing session found, redirecting');
            router.replace('/discovery-dashboard');
          } else {
            console.error('❌ [AuthCallback] No OAuth tokens or session found');
            setError('No authentication data found. Please try signing in again.');
            setLoading(false);
          }
        }

      } catch (error) {
        console.error('❌ [AuthCallback] Unexpected error:', error);
        setError('Something went wrong during authentication. Please try again.');
        setLoading(false);
      }
    };

    // Start processing immediately
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
            <p className="text-gray-400 text-sm">This should only take a moment</p>
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
              Return to Home & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
