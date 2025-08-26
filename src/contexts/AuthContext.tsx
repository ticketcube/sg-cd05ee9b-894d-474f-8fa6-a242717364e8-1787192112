
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import userProfileService from "@/services/userProfileService";

interface User {
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
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [profileExists, setProfileExists] = useState(false);
    const [loading, setLoading] = useState(true);

    /**
     * ✅ CRITICAL FIX: Simplified and robust profile loading
     * - Removes complex polling logic that was causing loops
     * - Uses direct API calls with proper error handling
     * - Clearly distinguishes between "profile doesn't exist" vs "temporary error"
     */
    const loadUserProfile = async (authUser: SupabaseUser) => {
        console.log(`🔍 [AuthContext] Loading profile for auth_id: ${authUser.id}`);
        
        try {
            // Direct API call to get profile - no polling needed
            const userProfile = await userProfileService.getUserProfile(authUser.id);
            
            if (userProfile) {
                // ✅ SUCCESS: Profile found and loaded
                console.log("✅ [AuthContext] Profile found and loaded:", userProfile.id, userProfile.username);
                
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
                console.log("🎉 [AuthContext] Profile loaded and state updated successfully");
                return;
            } else {
                // ✅ PROFILE DOESN'T EXIST: Clean case - show profile setup
                console.log("ℹ️ [AuthContext] Profile doesn't exist - user needs to complete profile setup");
                setUser(null);
                setProfileExists(false);
                localStorage.removeItem("otwchart_user");
                return;
            }
            
        } catch (error) {
            // ✅ HANDLE API ERRORS: Don't assume profile doesn't exist on error
            console.error("❌ [AuthContext] Error loading profile:", error);
            
            // If it's a network error or temporary issue, don't change profile state
            // Let the user try again or refresh the page
            console.log("⚠️ [AuthContext] Keeping current state due to API error");
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log("🚀 [AuthContext] Initializing auth...");
                
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error("❌ [AuthContext] Error getting session:", error);
                    setLoading(false);
                    return;
                }
                
                if (session?.user) {
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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("🔄 [AuthContext] Auth state changed:", event);
                
                if (session?.user) {
                    console.log("✅ [AuthContext] User signed in:", session.user.id);
                    setSupabaseUser(session.user);
                    setLoading(true);
                    await loadUserProfile(session.user);
                    setLoading(false);
                } else {
                    console.log("👋 [AuthContext] User signed out or no session");
                    setSupabaseUser(null);
                    setUser(null);
                    setProfileExists(false);
                    setLoading(false);
                    localStorage.removeItem("otwchart_user");
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const refreshUserProfile = useCallback(async () => {
        console.log("🔄 [AuthContext] Refreshing user profile...");
        
        if (supabaseUser) {
            setLoading(true);
            await loadUserProfile(supabaseUser);
            setLoading(false);
        } else {
            console.warn("⚠️ [AuthContext] No authenticated user to refresh");
        }
    }, [supabaseUser]);

    const login = async (username: string, email: string, city?: string) => {
        try {
            console.log("🔑 [AuthContext] Creating profile for authenticated user...");
            
            if (!supabaseUser) {
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
                auth_id: currentUser.id,
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

    const nuclearSessionCleanup = () => {
        console.log("💥 [AuthContext] NUCLEAR SESSION CLEANUP - Clearing ALL auth data...");
        
        setUser(null);
        setSupabaseUser(null);
        setProfileExists(false);
        
        try {
            localStorage.removeItem("otwchart_user");
            
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
            
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                console.warn("⚠️ [AuthContext] Logout API error (session corrupted):", error.message);
                
                if (error.message.includes('JWT') || 
                    error.message.includes('session') || 
                    error.message.includes('claim') ||
                    error.status === 403) {
                    console.log("🔑 [AuthContext] JWT/Session error detected - performing nuclear cleanup");
                } else {
                    console.log("💥 [AuthContext] Other auth error - performing nuclear cleanup");
                }
                
                nuclearSessionCleanup();
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
                return;
            } else {
                console.log("✅ [AuthContext] Successfully signed out from server");
            }
            
        } catch (error) {
            console.error("❌ [AuthContext] Logout error:", error);
            console.log("💥 [AuthContext] Exception during logout - performing nuclear cleanup");
            nuclearSessionCleanup();
            setTimeout(() => {
                window.location.href = '/';
            }, 100);
            return;
        }
        
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
