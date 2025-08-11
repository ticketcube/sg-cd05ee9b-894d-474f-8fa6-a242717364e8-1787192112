
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { userProfileService } from "@/services/userProfileService";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: number;
  auth_id: string; // The UUID from supabase.auth.users
  username: string;
  email: string;
  city?: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  login: (username: string, email: string, city?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          await loadUserProfile(session.user);
        } else {
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem("otwchart_user");
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Check if we have cached user data first
      const storedUser = localStorage.getItem("otwchart_user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.auth_id === authUser.id) {
            setUser(userData);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          localStorage.removeItem("otwchart_user");
        }
      }

      // Check if this is a magic link sign-in completion with temporary data
      const tempAuthData = localStorage.getItem("temp_auth_data");
      if (tempAuthData) {
        try {
          const tempData = JSON.parse(tempAuthData);
          console.log("🔗 Magic link authentication detected, completing profile...");
          
          // Complete the profile creation with the stored temporary data
          const userProfile = await userProfileService.createOrUpdateUserProfile({
            username: tempData.username,
            email: tempData.email,
            city: tempData.city
          });
          
          const userData: User = {
            id: userProfile.id,
            auth_id: authUser.id,
            username: userProfile.username,
            email: userProfile.email,
            city: userProfile.raw_city_input || undefined,
            points: userProfile.total_points || 0
          };
          
          setUser(userData);
          localStorage.setItem("otwchart_user", JSON.stringify(userData));
          localStorage.removeItem("temp_auth_data"); // Clean up temporary data
          console.log("✅ Profile completed successfully from magic link");
          return;
        } catch (error) {
          console.error("Error completing profile from magic link:", error);
          localStorage.removeItem("temp_auth_data");
          // Continue with normal flow below
        }
      }

      // Try to fetch user profile from database
      try {
        const userProfile = await userProfileService.getUserProfileByAuthId(authUser.id);
        if (userProfile) {
          const userData: User = {
            id: userProfile.id,
            auth_id: authUser.id,
            username: userProfile.username,
            email: userProfile.email,
            city: userProfile.raw_city_input || undefined,
            points: userProfile.total_points || 0
          };
          setUser(userData);
          localStorage.setItem("otwchart_user", JSON.stringify(userData));
          return;
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }

      // If no profile exists, create a minimal user object to allow authentication
      const minimalUser: User = {
        id: 0, // Will be set when they complete profile
        auth_id: authUser.id,
        username: authUser.email?.split('@')[0] || `user_${authUser.id.substring(0, 8)}`,
        email: authUser.email || '',
        city: undefined,
        points: 0
      };
      
      setUser(minimalUser);
      localStorage.setItem("otwchart_user", JSON.stringify(minimalUser));
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Still set a minimal user to allow authentication to work
      const fallbackUser: User = {
        id: 0,
        auth_id: authUser.id,
        username: authUser.email?.split('@')[0] || `user_${authUser.id.substring(0, 8)}`,
        email: authUser.email || '',
        city: undefined,
        points: 0
      };
      setUser(fallbackUser);
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
      
      const userProfile = await userProfileService.createOrUpdateUserProfile({
        username: username.trim(),
        email: email.trim(),
        city: city?.trim()
      });
      
      const userData: User = {
        id: userProfile.id,
        auth_id: currentSupabaseUser.id,
        username: userProfile.username,
        email: userProfile.email,
        city: userProfile.raw_city_input || undefined,
        points: userProfile.total_points || 0
      };
      
      setUser(userData);
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
      localStorage.removeItem("otwchart_user");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if signOut fails, clear local state
      setUser(null);
      setSupabaseUser(null);
      localStorage.removeItem("otwchart_user");
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    isAuthenticated: !!supabaseUser, // Simplify to rely on Supabase auth primarily
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