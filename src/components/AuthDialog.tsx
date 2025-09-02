import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Loader2, Mail, Lock } from "lucide-react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import SimpleCityInput from "@/components/SimpleCityInput";
import { useRouter } from "next/router";
import userProfileService from "@/services/userProfileService";

interface City {
    id: number;
    name: string;
    normalized_name: string;
    country_code?: string;
    state_code?: string;
}

interface AuthDialogProps {
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    description?: string;
}

export default function AuthDialog({
    isOpen,
    onClose,
    title = "Sign In or Register",
    description = ""
}: AuthDialogProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [customCity, setCustomCity] = useState("");
    const [loading, setLoading] = useState(false);
    
    const supabase = useSupabaseClient();
    const { refreshProfile } = useUserProfile();
    const router = useRouter();

    const handleCityChange = (city: City | null, customInput?: string) => {
        setSelectedCity(city);
        setCustomCity(customInput || "");
    };

    const handleSignUp = async () => {
        if (!username.trim() || !email.trim() || !password.trim()) {
            alert("Please fill in all required fields");
            return;
        }

        if (!selectedCity && !customCity.trim()) {
            alert("Please select or enter your city");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const cityName = selectedCity ? selectedCity.normalized_name : customCity.trim();

            console.log("🔑 [AuthDialog] Creating account with Supabase Auth...");
            
            // Step 1: Create account with Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim()
            });

            if (signUpError) {
                console.error("❌ [AuthDialog] Supabase sign-up error:", signUpError);
                throw new Error(signUpError.message || "Failed to create account. Please try again.");
            }

            if (authData.user && authData.session) {
                console.log("✅ [AuthDialog] Account created successfully with session");

                // Wait a moment to ensure auth state is consistent
                await new Promise(resolve => setTimeout(resolve, 300));

                try {
                    console.log("📝 [AuthDialog] Creating user profile...");
                    
                    // Step 2: Create user profile using the service
                    await userProfileService.createUserProfile(
                        authData.user.id, // auth_id
                        username.trim(),
                        email.trim(),
                        cityName
                    );
                    
                    console.log("✅ [AuthDialog] Profile created successfully");
                    
                    // Step 3: Refresh the profile context
                    await refreshProfile();

                    if (onClose) {
                        onClose();
                    }

                    // Navigate to discovery dashboard
                    await router.push("/discovery-dashboard");

                } catch (profileError) {
                    console.error("❌ [AuthDialog] Profile creation error:", profileError);
                    // Still close dialog since account was created
                    alert("Account created but there was an issue setting up your profile. Please try signing in.");
                    if (onClose) {
                        onClose();
                    }
                }
            } else if (authData.user && !authData.session) {
                // Handle case where email confirmation might be required
                console.log("ℹ️ [AuthDialog] Account created but no session - email confirmation may be required");
                alert("Account created! Please check your email to confirm your account.");
                if (onClose) {
                    onClose();
                }
            } else {
                throw new Error("Account creation failed. Please try again.");
            }

        } catch (error) {
            console.error("❌ [AuthDialog] Sign-up error:", error);
            alert(error instanceof Error ? error.message : "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            alert("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            console.log("🔑 [AuthDialog] Signing in with Supabase Auth...");
            
            // Sign in with Supabase Auth
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim()
            });

            if (signInError) {
                console.error("❌ [AuthDialog] Supabase sign-in error:", signInError);
                throw new Error(signInError.message || "Failed to sign in. Please check your credentials.");
            }

            if (authData.user) {
                console.log("✅ [AuthDialog] Successfully signed in");
                
                // The UserProfileContext will automatically load the profile
                // when the user state changes, but we can trigger a refresh
                await refreshProfile();
                
                if (onClose) {
                    onClose();
                }
                
                // Navigate to discovery dashboard
                await router.push("/discovery-dashboard");
            }

        } catch (error) {
            console.error("❌ [AuthDialog] Sign-in error:", error);
            alert(error instanceof Error ? error.message : "Failed to sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (isSignUp) {
            handleSignUp();
        } else {
            handleSignIn();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    const handleClose = () => {
        // Reset states when closing
        setUsername("");
        setEmail("");
        setPassword("");
        setSelectedCity(null);
        setCustomCity("");
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-w-sm mx-auto bg-white [&>button[aria-label='Close']]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-blue-600">
                        {isSignUp ? "We Reward Discovery" : "Welcome Back"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {description && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600">{description}</p>
                        </div>
                    )}

                    {/* Authentication Form */}
                    <div className="space-y-3">
                        {isSignUp && (
                            <div>
                                <Input
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full text-black placeholder:text-gray-500"
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-black placeholder:text-gray-500"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <Input
                                type="password"
                                placeholder="Password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full text-black placeholder:text-gray-500"
                                disabled={loading}
                            />
                        </div>

                        {isSignUp && (
                            <div>
                                <SimpleCityInput
                                    value={selectedCity}
                                    onValueChange={handleCityChange}
                                    placeholder="Enter your city..."
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isSignUp ? "Creating Account..." : "Signing In..."}
                            </>
                        ) : (
                            <>
                                {isSignUp ? (
                                    <>
                                        <User className="w-4 h-4 mr-2" />
                                        Create Account
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </>
                        )}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                            disabled={loading}
                        >
                            {isSignUp
                                ? "Already have an account? Sign In"
                                : "Need an account? Create Account"
                            }
                        </button>
                    </div>

                    <div className="text-xs text-center text-gray-500">
                        {isSignUp
                            ? "Your account will be created instantly - no email confirmation needed!"
                            : "Sign in with your email and password"
                        }
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}