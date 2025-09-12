import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, getUserEngagementHistory, type UserProfile } from "@/services/userProfileService";

interface UserProfileContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get user profile and calculate total points from user_engagements
      const userProfile = await getUserProfile(user.id);
      if (!userProfile) return;

      // Get engagement history to calculate accurate total points
      const engagementHistory = await getUserEngagementHistory(user.id);
      
      // Update the profile with the calculated total points
      const updatedProfile = {
        ...userProfile,
        total_points: engagementHistory.total_points
      };

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  }, [user?.id]);

  const loadUserProfile = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      
      // Get user profile
      const userProfile = await getUserProfile(currentUser.id);
      
      if (!userProfile) {
        console.error("No profile found for user:", currentUser.id);
        setProfile(null);
        return;
      }

      // Get engagement history to calculate accurate total points
      const engagementHistory = await getUserEngagementHistory(currentUser.id);
      
      // Update the profile with the calculated total points from engagements
      const updatedProfile = {
        ...userProfile,
        total_points: engagementHistory.total_points
      };

      setProfile(updatedProfile);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial session check
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const value: UserProfileContextType = {
    user,
    profile,
    isAuthenticated,
    loading,
    refreshProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};