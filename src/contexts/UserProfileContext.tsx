
    import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
    import { User } from "@supabase/supabase-js";
    import { supabase } from "@/integrations/supabase/client";
    import { getUserProfile, getUserEngagementHistory, type UserProfile } from "@/services/userProfileService";

    interface UserProfileContextType {
      user: User | null;
      profile: UserProfile | null;
      isAuthenticated: boolean;
      loading: boolean; // For profile loading
      sessionLoading: boolean; // For initial auth session check
      role: string | null;
      logout: () => Promise<void>;
      refreshProfile: () => Promise<void>;
    }

    const UserProfileContext = createContext<UserProfileContextType | null>(null);

    export const useUserProfile = () => {
      const context = useContext(UserProfileContext);
      if (!context) {
        throw new Error("useUserProfile must be used within a UserProfileProvider");
      }
      return context;
    };

    interface UserProfileProviderProps {
      children: React.ReactNode;
    }

    export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
      const [user, setUser] = useState<User | null>(null);
      const [profile, setProfile] = useState<UserProfile | null>(null);
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [loading, setLoading] = useState(false); // Tracks profile loading, defaults to false
      const [sessionLoading, setSessionLoading] = useState(true); // Tracks initial auth check, starts true
      const [role, setRole] = useState<string | null>(null);

      const refreshProfile = useCallback(async () => {
        if (!user?.id) return;

        try {
          const userProfile = await getUserProfile(user.id);
          if (!userProfile) return;

          const engagementHistory = await getUserEngagementHistory(user.id);
          
          const updatedProfile = {
            ...userProfile,
            total_points: engagementHistory.total_points
          };

          setProfile(updatedProfile);
          setRole(updatedProfile.role);
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      }, [user?.id]);

      const loadUserProfile = useCallback(async (currentUser: User) => {
        try {
          setLoading(true);
          
          const userProfile = await getUserProfile(currentUser.id);
          
          if (!userProfile) {
            console.error("No profile found for user:", currentUser.id);
            setProfile(null);
            return;
          }

          const engagementHistory = await getUserEngagementHistory(currentUser.id);
          
          const updatedProfile = {
            ...userProfile,
            total_points: engagementHistory.total_points
          };

          setProfile(updatedProfile);
          setRole(updatedProfile.role);
        } catch (error) {
          console.error("Error loading user profile:", error);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        // onAuthStateChange fires on initial load with session data, making a separate getSession call redundant and safer.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event, session?.user?.email);
            
            if (session?.user) {
              setUser(session.user);
              setIsAuthenticated(true);
              await loadUserProfile(session.user);
            } else {
              setUser(null);
              setProfile(null);
              setRole(null);
              setIsAuthenticated(false);
              setLoading(false); // No user, so not loading a profile
            }
            // The initial session check is complete, regardless of outcome.
            setSessionLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      }, [loadUserProfile]);

      const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRole(null);
        setIsAuthenticated(false);
      };

      const value: UserProfileContextType = {
        user,
        profile,
        isAuthenticated,
        loading,
        sessionLoading,
        role,
        logout,
        refreshProfile,
      };

      return (
        <UserProfileContext.Provider value={value}>
          {children}
        </UserProfileContext.Provider>
      );
    };
  