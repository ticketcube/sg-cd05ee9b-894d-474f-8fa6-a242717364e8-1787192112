
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import userProfileService from "@/services/userProfileService";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: number;
  auth_id: string; // The UUID from supabase.auth.users
  username: string;
  email: string;
  city?: string;
  points?: number;
  role?: string;
}

interface AuthContextType {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    isAuthenticated: boolean;
    profileExists: boolean; // New flag to track profile status
    login: (username: string, email: string, city?: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext < AuthContextType | undefined > (undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState < User | null > (null);
    const [supabaseUser, setSupabaseUser] = useState < SupabaseUser | null > (null);
    const [profileExists, setProfileExists] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session and set up auth state listener
        const initializeAuth = async () => {
            try {
                // Get current session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error getting session:", error);
                } else if (session?.user) {
                    setSupabaseUser(session.user);
                    await loadUserProfile(session.user);
                }
            } catch (error) {
                console.error("Error initializing auth:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth state changed:", event, session?.user?.id);

                if (session?.user) {
                    setSupabaseUser(session.user);
                    // Wait a moment for Supabase client to fully sync auth context
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await loadUserProfile(session.user);
                } else {
                    setSupabaseUser(null);
                    setUser(null);
                    setProfileExists(false);
                    localStorage.removeItem("otwchart_user");
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (authUser: SupabaseUser) => {
        try {
            console.log("🔍 Loading user profile for auth user:", authUser.id, authUser.email);
            
            // Try to load profile via secure API
            console.log("🔄 Using secure API approach for profile loading...");
            
            try {
                const userProfile = await userProfileService.getUserProfile(authUser.id);
                
                if (userProfile && userProfile.id) {
                    console.log("✅ Successfully fetched user profile from API:", userProfile);
                    const userData: User = {
                        id: userProfile.id,
                        auth_id: authUser.id,
                        username: userProfile.username,
                        email: userProfile.email,
                        city: userProfile.raw_city_input || undefined,
                        points: userProfile.total_points || 0,
                        role: userProfile.role || undefined
                    };
                    setUser(userData);
                    setProfileExists(true);
                    localStorage.setItem("otwchart_user", JSON.stringify(userData));
                    console.log("🎉 User profile loaded successfully via API with ID:", userData.id);
                    return;
                }
            } catch (apiError) {
                console.error("❌ Secure API approach failed:", apiError);
                
                // If the API says profile not found, that's definitive
                if (apiError instanceof Error && apiError.message.includes('Profile not found')) {
                    console.log("⚠️ Profile confirmed not found - user needs profile creation");
                    setProfileExists(false);
                    // Don't set user yet - let the profile creation flow handle it
                    setUser(null);
                    return;
                } else {
                    // For other API errors, try the direct database approach as fallback
                    console.log("🔄 Falling back to direct database query...");
                    
                    try {
                        // Wait for Supabase auth context to be fully ready
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const { data: profile, error } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('auth_id', authUser.id)
                            .single();

                        if (error) {
                            if (error.code === 'PGRST116') {
                                console.log("⚠️ No profile found in database for auth ID:", authUser.id);
                                setProfileExists(false);
                                setUser(null);
                                return;
                            } else {
                                console.error("❌ Database query error:", error);
                            }
                        } else if (profile && profile.id) {
                            console.log("✅ Successfully found user profile in database:", profile);
                            const userData: User = {
                                id: profile.id,
                                auth_id: authUser.id,
                                username: profile.username,
                                email: profile.email,
                                city: profile.raw_city_input || undefined,
                                points: profile.total_points || 0,
                                role: profile.role || undefined
                            };
                            
                            setUser(userData);
                            setProfileExists(true);
                            localStorage.setItem("otwchart_user", JSON.stringify(userData));
                            console.log("🎉 User profile loaded successfully from database with ID:", userData.id);
                            return;
                        }
                    } catch (directError) {
                        console.error("❌ Direct database query also failed:", directError);
                    }
                }
            }

            // If we get here, profile doesn't exist - clear any existing user data
            console.log("⚙️ No profile found - user will need to complete profile setup");
            setProfileExists(false);
            setUser(null);
            localStorage.removeItem("otwchart_user");

        } catch (error) {
            console.error("🚨 Error loading user profile:", error);
            setProfileExists(false);
            setUser(null);
            localStorage.removeItem("otwchart_user");
        }
    };

    const login = async (username: string, email: string, city?: string) => {
        try {
            let currentSupabaseUser = supabaseUser;

            // If we don't have supabaseUser in state, try to get current session
            if (!currentSupabaseUser) {
                console.log("No supabaseUser in state, fetching current session...");
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("Session error:", sessionError);
                    throw new Error("Failed to get authentication session. Please try signing in again.");
                }

                if (session?.user) {
                    currentSupabaseUser = session.user;
                    setSupabaseUser(session.user); // Update state for consistency
                    console.log("Found authenticated user in session:", session.user.id);
                } else {
                    throw new Error("No authenticated session found. Please sign in first.");
                }
            }

            console.log("Creating/updating user profile for authenticated user:", currentSupabaseUser.id);

            const userProfile = await userProfileService.createUserProfile(
                currentSupabaseUser.id,
                username.trim(),
                email.trim(),
                city?.trim()
            );

            const userData: User = {
                id: userProfile.id,
                auth_id: currentSupabaseUser.id,
                username: userProfile.username,
                email: userProfile.email,
                city: userProfile.raw_city_input || undefined,
                points: userProfile.total_points || 0
            };

            setUser(userData);
            setProfileExists(true);
            localStorage.setItem("otwchart_user", JSON.stringify(userData));
            console.log("✅ User profile created/updated successfully:", userData.id);
            
        } catch (error) {
            console.error("Login error:", error);
            throw error; // Re-throw the original error for better debugging
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setSupabaseUser(null);
            setProfileExists(false);
            localStorage.removeItem("otwchart_user");
        } catch (error) {
            console.error("Logout error:", error);
            // Even if signOut fails, clear local state
            setUser(null);
            setSupabaseUser(null);
            setProfileExists(false);
            localStorage.removeItem("otwchart_user");
        }
    };

    const value: AuthContextType = {
        user,
        supabaseUser,
        isAuthenticated: !!supabaseUser,
        profileExists,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
