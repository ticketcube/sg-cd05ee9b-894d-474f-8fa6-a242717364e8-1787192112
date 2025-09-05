import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, AlertCircle } from "lucide-react";
import { authService } from "@/services/authService";

interface AuthDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export default function AuthDialog({
  isOpen,
  onClose,
  title = "Sign In to Continue",
  description = "Discover and support emerging artists"
}: AuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await authService.signInWithGoogle();
      
      if (authError) {
        console.error('Google sign-in error:', authError);
        setError('Failed to sign in with Google. Please try again.');
        return;
      }

      // OAuth redirect is happening, no need to do anything else here
      // The callback page will handle the rest of the flow

    } catch (error) {
      console.error('Error initiating Google sign-in:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto bg-white rounded-3xl shadow-2xl [&>button[aria-label='Close']]:hidden">
        <DialogHeader className="space-y-4 pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-neutral-900">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-center text-neutral-600 text-sm">
              {description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 shadow-sm h-12 font-medium transition-all duration-200 hover:shadow-md"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Info Text */}
          <div className="text-center space-y-2">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <p className="text-xs text-neutral-400">
              New to onestowatch? You'll choose a username after signing in
            </p>
          </div>

          {/* Legacy Users Notice */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-neutral-700 mb-1">
                Existing email/password users
              </p>
              <p className="text-xs text-neutral-500">
                Please contact support to migrate your account to Google OAuth
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}