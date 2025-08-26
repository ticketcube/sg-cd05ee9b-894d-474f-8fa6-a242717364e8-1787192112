
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import userProfileService from "@/services/userProfileService";

interface User {
    auth_id: string;      // ✅ This is now the primary key (UUID)
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
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [profileExists, setProfileExists] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadUserProfile = async (authUser: SupabaseUser) => {
        try {
            console.log("🔍 [AuthContext] Loading user profile for:", authUser.id);
            
            // Use the secure API to get profile by auth_id
            const userProfile = await userProfileService.getUserProfile(authUser.id);
            
            console.log("✅ [AuthContext] Profile found via API:", userProfile.auth_id, userProfile.username);
            
            const userData: User = {
                auth_id: authUser.id,          // ✅ Use auth_id as primary identifier
                username: userProfile.username,
                email: userProfile.email,
                city: userProfile.raw_city_input || undefined,
                points: userProfile.total_points || 0,
                role: userProfile.role || undefined
            };
            
            setUser(userData);
            setProfileExists(true);
            localStorage.setItem("otwchart_user", JSON.stringify(userData));
            console.log("🎉 [AuthContext] Profile loaded successfully:", userData.auth_id);
            
        } catch (error) {
            console.log("⚠️ [AuthContext] Profile not found - this is expected for new users");
            console.log("🔧 [AuthContext] Setting up for profile creation flow...");
            
            // ✅ CRITICAL FIX: Handle "Profile not found" gracefully
            // This is expected for new users who just signed up
            setUser(null);
            setProfileExists(false);
            localStorage.removeItem("otwchart_user");
            
            // Don't throw the error - let the UI handle showing profile setup
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log("🚀 [AuthContext] Initializing auth...");
                
                // Get current session
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error("❌ [AuthContext] Error getting session:", error);
                } else if (session?.user) {
                    console.log("✅ [AuthContext] Found existing session for:", session.user.id);
                    setSupabaseUser(session.user);
                    await loadUserProfile(session.user);
                } else {
                    console.log("ℹ️ [AuthContext] No existing session");
                }
            } catch (error) {
                console.error("🚨 [AuthContext] Error initializing auth:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("🔄 [AuthContext] Auth state changed:", event);
                
                if (session?.user) {
                    console.log("✅ [AuthContext] User signed in:", session.user.id);
                    setSupabaseUser(session.user);
                    await loadUserProfile(session.user);
                } else {
                    console.log("👋 [AuthContext] User signed out or no session");
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

    const refreshUserProfile = useCallback(async () => {
        console.log("🔄 [AuthContext] Refreshing user profile...");
        
        if (supabaseUser) {
            await loadUserProfile(supabaseUser);
        } else {
            console.warn("⚠️ [AuthContext] No authenticated user to refresh");
        }
    }, [supabaseUser]);

    const login = async (username: string, email: string, city?: string) => {
        try {
            console.log("🔑 [AuthContext] Creating profile for authenticated user...");
            
            if (!supabaseUser) {
                // Try to get current session
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session?.user) {
                    throw new Error("No authenticated session found. Please sign in first.");
                }
                setSupabaseUser(session.user);
            }

            const currentUser = supabaseUser || (await supabase.auth.getSession()).data.session?.user;
            if (!currentUser) {
                throw new Error("Authentication required");
            }

            console.log("📝 [AuthContext] Creating profile via service...");
            const userProfile = await userProfileService.createUserProfile(
                currentUser.id,
                username.trim(),
                email.trim(),
                city?.trim()
            );

            const userData: User = {
                auth_id: currentUser.id,       // ✅ Use auth_id as primary identifier
                username: userProfile.username,
                email: userProfile.email,
                city: userProfile.raw_city_input || undefined,
                points: userProfile.total_points || 0,
                role: userProfile.role || undefined
            };

            setUser(userData);
            setProfileExists(true);
            localStorage.setItem("otwchart_user", JSON.stringify(userData));
            console.log("✅ [AuthContext] Profile created successfully:", userData.auth_id);
            
        } catch (error) {
            console.error("❌ [AuthContext] Login error:", error);
            throw error;
        }
    };

    // Add this nuclear cleanup function at the top level of the AuthProvider
    const nuclearSessionCleanup = () => {
        console.log("💥 [AuthContext] NUCLEAR SESSION CLEANUP - Clearing ALL auth data...");
        
        // Clear all state
        setUser(null);
        setSupabaseUser(null);
        setProfileExists(false);
        
        // Clear localStorage
        try {
            // Clear our app's user data
            localStorage.removeItem("otwchart_user");
            
            // Clear ALL Supabase-related localStorage keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.includes('supabase') || 
                    key.includes('sb-') ||
                    key.startsWith('sb.') ||
                    key.includes('auth-token') ||
                    key.includes('access_token') ||
                    key.includes('refresh_token')
                )) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                console.log("🗑️ [AuthContext] Removing corrupted key:", key);
                localStorage.removeItem(key);
            });
            
            // Also clear sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('supabase') || key.includes('sb-'))) {
                    sessionStorage.removeItem(key);
                }
            }
            
            console.log("✅ [AuthContext] Nuclear cleanup completed");
            
        } catch (error) {
            console.warn("⚠️ [AuthContext] Error during nuclear cleanup:", error);
        }
    };

    const logout = async () => {
        try {
            console.log("👋 [AuthContext] Signing out...");
            
            // Try normal logout first, but with a shorter timeout
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.warn("⚠️ [AuthContext] Logout API error (session corrupted):", error.message);
                
                // Check specifically for JWT/session errors
                if (error.message.includes('JWT') || 
                    error.message.includes('session') || 
                    error.message.includes('claim') ||
                    error.status === 403) {
                    console.log("🔑 [AuthContext] JWT/Session error detected - performing nuclear cleanup");
                } else {
                    console.log("💥 [AuthContext] Other auth error - performing nuclear cleanup");
                }
                
                // For ANY error, do nuclear cleanup
                nuclearSessionCleanup();
                
                // Force page reload to completely reset the app state
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
                
                return;
            } else {
                console.log("✅ [AuthContext] Successfully signed out from server");
            }
            
        } catch (error) {
            console.error("❌ [AuthContext] Logout error:", error);
            
            // ANY error during logout = nuclear cleanup
            console.log("💥 [AuthContext] Exception during logout - performing nuclear cleanup");
            nuclearSessionCleanup();
            
            // Force page reload to completely reset the app state
            setTimeout(() => {
                window.location.href = '/';
            }, 100);
            
            return;
        }
        
        // Normal successful logout path
        console.log("🧹 [AuthContext] Clearing local auth state...");
        setUser(null);
        setSupabaseUser(null);
        setProfileExists(false);
        localStorage.removeItem("otwchart_user");
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