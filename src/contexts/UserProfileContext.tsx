
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, getUserEngagementHistory, type UserProfile, type UserEngagementHistory } from "@/services/userProfileService";

interface UserProfileContextType {
  user: User | null;
  profile: UserProfile | null;
  engagementHistory: UserEngagementHistory | null;
  isAuthenticated: boolean;
  loading: boolean; // For profile loading
  sessionLoading: boolean; // For initial auth session check
  historyLoading: boolean; // For engagement history loading
  historyError: string | null;
  role: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryHistory: () => Promise<void>;
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
  const [engagementHistory, setEngagementHistory] = useState<UserEngagementHistory | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // Tracks profile loading
  const [sessionLoading, setSessionLoading] = useState(true); // Tracks initial auth check
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Request management for mobile optimization
  const profileAbortController = useRef<AbortController | null>(null);
  const historyAbortController = useRef<AbortController | null>(null);
  const loadingRequests = useRef<Set<string>>(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    if (profileAbortController.current) {
      profileAbortController.current.abort();
      profileAbortController.current = null;
    }
    if (historyAbortController.current) {
      historyAbortController.current.abort();
      historyAbortController.current = null;
    }
    loadingRequests.current.clear();
  }, []);

  const loadEngagementHistory = useCallback(async (userId: string) => {
    const requestKey = `history-${userId}`;
    
    // Prevent duplicate requests
    if (loadingRequests.current.has(requestKey)) {
      console.log('[UserProfile] History request already in progress, skipping duplicate');
      return;
    }

    // Abort previous history request
    if (historyAbortController.current) {
      historyAbortController.current.abort();
    }

    historyAbortController.current = new AbortController();
    const { signal } = historyAbortController.current;

    loadingRequests.current.add(requestKey);

    try {
      setHistoryLoading(true);
      setHistoryError(null);

      console.log('[UserProfile] Loading engagement history for user:', userId);
      
      const history = await getUserEngagementHistory(userId, signal);

      if (!signal.aborted) {
        setEngagementHistory(history);
        console.log('[UserProfile] Engagement history loaded successfully');
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('[UserProfile] Error loading engagement history:', error);
        setHistoryError('Failed to load engagement data');
        setEngagementHistory(null);
      }
    } finally {
      loadingRequests.current.delete(requestKey);
      // Always reset loading state, even if aborted
      setHistoryLoading(false);
    }
  }, []);

  const loadUserProfile = useCallback(async (currentUser: User) => {
    const requestKey = `profile-${currentUser.id}`;
    
    // Prevent duplicate requests
    if (loadingRequests.current.has(requestKey)) {
      console.log('[UserProfile] Profile request already in progress, skipping duplicate');
      return;
    }

    // Abort previous profile request
    if (profileAbortController.current) {
      profileAbortController.current.abort();
    }

    profileAbortController.current = new AbortController();
    const { signal } = profileAbortController.current;

    loadingRequests.current.add(requestKey);

    try {
      setLoading(true);
      
      console.log('[UserProfile] Loading profile for user:', currentUser.id);
      const userProfile = await getUserProfile(currentUser.id);
      
      if (!signal.aborted) {
        if (!userProfile) {
          console.error('[UserProfile] No profile found for user:', currentUser.id);
          setProfile(null);
          setRole(null);
        } else {
          setProfile(userProfile);
          setRole(userProfile.role);
          console.log('[UserProfile] Profile loaded successfully');
          
          // ✅ COMPLETE FIX: Remove automatic engagement history loading entirely
          // Engagement history will only load when explicitly requested via retryHistory()
          // This prevents ANY blocking on first refresh while keeping the functionality available
          console.log('[UserProfile] Profile ready - engagement history will load on demand');
        }
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('[UserProfile] Error loading user profile:', error);
        setProfile(null);
        setRole(null);
      }
    } finally {
      loadingRequests.current.delete(requestKey);
      // Always reset loading state, even if aborted
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userProfile = await getUserProfile(user.id);
      if (!userProfile) return;

      setProfile(userProfile);
      setRole(userProfile.role);

      // Refresh engagement history
      await loadEngagementHistory(user.id);
    } catch (error) {
      console.error('[UserProfile] Error refreshing profile:', error);
    }
  }, [user?.id, loadEngagementHistory]);

  const retryHistory = useCallback(async () => {
    if (!user?.id) return;
    await loadEngagementHistory(user.id);
  }, [user?.id, loadEngagementHistory]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UserProfile] Auth state changed:', event, session?.user?.email);
        
        // Cleanup previous requests when auth state changes
        cleanup();
        
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
          setEngagementHistory(null);
          setRole(null);
          setIsAuthenticated(false);
          setLoading(false);
          setHistoryLoading(false);
          setHistoryError(null);
        }
        setSessionLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      cleanup();
    };
  }, [loadUserProfile, cleanup]);

  const logout = async () => {
    cleanup();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setEngagementHistory(null);
    setRole(null);
    setIsAuthenticated(false);
    setHistoryError(null);
  };

  const value: UserProfileContextType = {
    user,
    profile,
    engagementHistory,
    isAuthenticated,
    loading,
    sessionLoading,
    historyLoading,
    historyError,
    role,
    logout,
    refreshProfile,
    retryHistory,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};