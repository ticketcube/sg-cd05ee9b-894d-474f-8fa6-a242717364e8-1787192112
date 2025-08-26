
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

    const loadUserProfile = async (authUser: SupabaseUser, retryCount = 0) => {
        try {
            console.log(`🔍 [AuthContext] Loading user profile for: ${authUser.id} (attempt ${retryCount + 1})`);
            
            // ✅ CRITICAL FIX: Handle race condition between auth signup and profile creation trigger
            const response = await fetch(`/api/user/profile-by-auth-id?auth_id=${authUser.id}`);
            
            if (response.status === 404) {
                // Profile doesn't exist yet - this could be a race condition with the trigger
                console.log(`ℹ️ [AuthContext] Profile not found for ${authUser.id}`);
                
                // ✅ RETRY LOGIC: For new users, wait a moment for the trigger to create the profile
                if (retryCount < 3) {
                    console.log(`🔄 [AuthContext] Retrying profile load in 1 second (attempt ${retryCount + 1}/3)...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return loadUserProfile(authUser, retryCount + 1);
                }
                
                // After retries, user genuinely needs profile setup
                console.log("ℹ️ [AuthContext] No profile found after retries - user needs to complete setup");
                setUser(null);
                setProfileExists(false);
                localStorage.removeItem("otwchart_user");
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const userProfile = await response.json();
            console.log("✅ [AuthContext] Profile found via API:", userProfile.auth_id, userProfile.username);
            
            const userData: User = {
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
            console.log("🎉 [AuthContext] Profile loaded successfully:", userData.auth_id);
            
        } catch (error) {
            console.error("❌ [AuthContext] Unexpected error loading profile:", error);
            
            // For any unexpected errors, assume profile doesn't exist
            setUser(null);
            setProfileExists(false);
            localStorage.removeItem("otwchart_user");
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