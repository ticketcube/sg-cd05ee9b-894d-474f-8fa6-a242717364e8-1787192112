import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, Mail, Eye, EyeOff } from "lucide-react";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type AuthMode = "signin" | "signup";

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);


export default function AuthDialog({ isOpen, onClose, title = "Welcome to OnesToWatch", description }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🔄 [AuthDialog] Starting Google OAuth sign in");
      
      const { error } = await authService.signInWithGoogle();

      if (error) {
        console.error("❌ [AuthDialog] OAuth error:", error);
        setError(error.message);
      } else {
        console.log("✅ [AuthDialog] Google OAuth initiated successfully");
      }
    } catch (err) {
      console.error("❌ [AuthDialog] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🔄 [AuthDialog] Starting Apple OAuth sign in");
      const { error } = await authService.signInWithApple();

      if (error) {
        console.error("❌ [AuthDialog] Apple OAuth error:", error);
        setError(error.message);
      } else {
        console.log("✅ [AuthDialog] Apple OAuth initiated successfully");
      }
    } catch (err) {
      console.error("❌ [AuthDialog] Unexpected error during Apple Sign in:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };


  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (authMode === "signin") {
        console.log("🔄 [AuthDialog] Starting email sign in");
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("❌ [AuthDialog] Email sign in error:", error);
          setError(error.message);
          return;
        }

        console.log("✅ [AuthDialog] Email sign in successful");
        onClose(); // Close dialog on successful sign in
        
      } else {
        console.log("🔄 [AuthDialog] Starting email sign up");
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error("❌ [AuthDialog] Email sign up error:", error);
          setError(error.message);
          return;
        }

        console.log("✅ [AuthDialog] Email sign up initiated");
        
        if (data.user && !data.user.email_confirmed_at) {
          setSuccess("Check your email for a confirmation link to complete registration!");
        } else {
          onClose(); // Close dialog if sign up was successful and confirmed
        }
      }
      
    } catch (err) {
      console.error("❌ [AuthDialog] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <DialogHeader className="text-center space-y-3">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-black">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Social Logins */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-3 font-medium flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            <Button
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white border border-gray-800 py-3 font-medium flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                                      <AppleIcon className="w-5 h-5 flex-shrink-0" />                  Continue with Apple
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-gray-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">or</span>
            </div>
          </div>

          {/* Email Auth Form */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange("signin")}
                className={`${authMode === "signin" ? "text-black bg-gray-100" : "text-gray-500"}`}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange("signup")}
                className={`${authMode === "signup" ? "text-black bg-gray-100" : "text-gray-500"}`}
              >
                Sign Up
              </Button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-black">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-gray-200 text-black placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-black">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-gray-200 text-black placeholder:text-gray-400 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm text-black">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white border-gray-200 text-black placeholder:text-gray-400"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 font-medium flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    {authMode === "signin" ? "Sign In with Email" : "Create Account"}
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              {authMode === "signup" && " Your account will be created with a generated username that you can change later."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}