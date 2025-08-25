
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import userProfileService from "@/services/userProfileService";

interface User {
    id: number;
    auth_id: string;
    username: string;
    email: string;
    city?: string;
    points: number;
    role?: string;
}

interface AuthContextType {
    supabaseUser: SupabaseUser | null;
    user: User | null;
    profileExists: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    refreshUserProfile: () => Promise<void>;
    login: (username: string, email: string, city?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    supabaseUser: null,
    user: null,
    profileExists: false,
    loading: true,
    isAuthenticated: false,
    refreshUserProfile: async () => {},
    login: async () => {},
    logout: async () => {}
});

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

    const loadUserProfile = async (authUser: SupabaseUser, retryCount = 0) => {
        try {
            console.log(`🔍 [AuthContext] Loading user profile for auth user (attempt ${retryCount + 1}):`);
            console.log(`  - Auth ID: ${authUser.id}`);
            console.log(`  - Email: ${authUser.email}`);
            console.log(`  - Current user state:`, user ? `ID:${user.id}, exists:true` : "null");
            console.log(`  - Current profileExists:`, profileExists);
            
            // Try to load profile via secure API
            console.log("🔄 [AuthContext] Using secure API approach for profile loading...");
            
            try {
                const userProfile = await userProfileService.getUserProfile(authUser.id);
                
                if (userProfile && userProfile.id) {
                    console.log("✅ [AuthContext] Successfully fetched user profile from API:");
                    console.log(`  - Profile ID: ${userProfile.id}`);
                    console.log(`  - Username: ${userProfile.username}`);
                    console.log(`  - Email: ${userProfile.email}`);
                    console.log(`  - Points: ${userProfile.total_points}`);
                    
                    const userData: User = {
                        id: userProfile.id,
                        auth_id: authUser.id,
                        username: userProfile.username,
                        email: userProfile.email,
                        city: userProfile.raw_city_input || undefined,
                        points: userProfile.total_points || 0,
                        role: userProfile.role || undefined
                    };
                    
                    console.log("🎯 [AuthContext] Setting user state:", userData);
                    setUser(userData);
                    
                    console.log("🎯 [AuthContext] Setting profileExists to true");
                    setProfileExists(true);
                    
                    localStorage.setItem("otwchart_user", JSON.stringify(userData));
                    console.log("🎉 [AuthContext] User profile loaded successfully via API with ID:", userData.id);
                    return;
                }
            } catch (apiError) {
                console.error("❌ [AuthContext] Secure API approach failed:", apiError);
                
                // If the API says profile not found, that's definitive
                if (apiError instanceof Error && apiError.message.includes('Profile not found')) {
                    console.log("⚠️ [AuthContext] Profile confirmed not found - user needs profile creation");
                    console.log("🎯 [AuthContext] Setting user to null");
                    setUser(null);
                    
                    console.log("🎯 [AuthContext] Setting profileExists to false");
                    setProfileExists(false);
                    
                    localStorage.removeItem("otwchart_user");
                    return;
                } else {
                    // For other API errors, try direct database approach as fallback
                    console.log("🔄 [AuthContext] Falling back to direct database query...");
                    
                    try {
                        // Wait for Supabase auth context to be fully ready
                        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * (retryCount + 1), 3000)));
                        
                        const { data: profile, error } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('auth_id', authUser.id)
                            .single();

                        if (error) {
                            if (error.code === 'PGRST116') {
                                console.log("⚠️ [AuthContext] No profile found in database for auth ID:", authUser.id);
                                console.log("🎯 [AuthContext] Setting user to null (database check)");
                                setUser(null);
                                
                                console.log("🎯 [AuthContext] Setting profileExists to false (database check)");
                                setProfileExists(false);
                                
                                localStorage.removeItem("otwchart_user");
                                return;
                            } else {
                                console.error("❌ [AuthContext] Database query error:", error);
                                // If it's a permission error and we haven't retried much, try again
                                if (error.code === '42501' && retryCount < 2) {
                                    console.log(`🔄 [AuthContext] Retrying profile load due to permission error (attempt ${retryCount + 1})`);
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                    return loadUserProfile(authUser, retryCount + 1);
                                }
                            }
                        } else if (profile && profile.id) {
                            console.log("✅ [AuthContext] Successfully found user profile in database:");
                            console.log(`  - Profile ID: ${profile.id}`);
                            console.log(`  - Username: ${profile.username}`);
                            
                            const userData: User = {
                                id: profile.id,
                                auth_id: authUser.id,
                                username: profile.username,
                                email: profile.email,
                                city: profile.raw_city_input || undefined,
                                points: profile.total_points || 0,
                                role: profile.role || undefined
                            };
                            
                            console.log("🎯 [AuthContext] Setting user state from database:", userData);
                            setUser(userData);
                            
                            console.log("🎯 [AuthContext] Setting profileExists to true from database");
                            setProfileExists(true);
                            
                            localStorage.setItem("otwchart_user", JSON.stringify(userData));
                            console.log("🎉 [AuthContext] User profile loaded successfully from database with ID:", userData.id);
                            return;
                        }
                    } catch (directError) {
                        console.error("❌ [AuthContext] Direct database query also failed:", directError);
                        // If both methods failed and we haven't retried much, try once more
                        if (retryCount < 1) {
                            console.log(`🔄 [AuthContext] Both methods failed, retrying entire profile load (attempt ${retryCount + 1})`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            return loadUserProfile(authUser, retryCount + 1);
                        }
                    }
                }
            }

            // If we get here, profile doesn't exist or all attempts failed
            console.log("⚙️ [AuthContext] No profile found - user will need to complete profile setup");
            console.log("🎯 [AuthContext] Setting user to null (fallback)");
            setUser(null);
            
            console.log("🎯 [AuthContext] Setting profileExists to false (fallback)");
            setProfileExists(false);
            
            localStorage.removeItem("otwchart_user");

        } catch (error) {
            console.error("🚨 [AuthContext] Error loading user profile:", error);
            console.log("🎯 [AuthContext] Setting user to null (error)");
            setUser(null);
            
            console.log("🎯 [AuthContext] Setting profileExists to false (error)");
            setProfileExists(false);
            
            localStorage.removeItem("otwchart_user");
        }
    };

    // Memoized refresh function to prevent infinite loops
    const refreshUserProfile = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            console.log("🔄 [AuthContext] Manually refreshing user profile for:", session.user.id);
            console.log("  - Current user state before refresh:", user ? `ID:${user.id}` : "null");
            console.log("  - Current profileExists before refresh:", profileExists);
            
            await loadUserProfile(session.user);
            
            console.log("✅ [AuthContext] Profile refresh completed");
        } else {
            console.warn("⚠️ [AuthContext] Cannot refresh profile - no authenticated user available");
        }
    }, []); // No dependencies to prevent infinite loops

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
        refreshUserProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}