import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, getUserEngagementHistory, subscribeToProfileChanges, type UserProfile, type UserEngagementHistory } from "@/services/userProfileService";

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
  isStuck: boolean;
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
  const lastUserIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false); // Tracks profile loading
  const [sessionLoading, setSessionLoading] = useState(true); // Tracks initial auth check
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!user) {
        return;
    }

    console.log('[UserProfileContext] Subscribing to profile changes for user:', user.id);
    const unsubscribe = subscribeToProfileChanges((updatedProfile) => {
        if (updatedProfile && updatedProfile.user_id === user.id) {
            console.log('[UserProfileContext] Received profile update via subscription:', updatedProfile);
            setProfile(updatedProfile);
            setRole(updatedProfile.role);
        }
    });

    // Cleanup subscription on unmount or user change
    return () => {
        console.log('[UserProfileContext] Unsubscribing from profile changes.');
        unsubscribe();
    };
}, [user]);

  // Request management
  const profileAbortController = useRef<AbortController | null>(null);
  const historyAbortController = useRef<AbortController | null>(null);
  const loadingRequests = useRef<Set<string>>(new Set());
  const failsafeTriggered = useRef(false); // Flag for the stuck state

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

  const loadEngagementHistory = useCallback(async (userId: string, profileData?: UserProfile) => {
    const requestKey = `history-${userId}`;
    
    if (loadingRequests.current.has(requestKey)) {
      console.log('[UserProfile] History request already in progress, skipping duplicate');
      return;
    }

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
      
     const history = await getUserEngagementHistory(userId, profileData || profile, signal);

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
      setHistoryLoading(false);
    }
  }, [profile]);

  const loadUserProfile = useCallback(async (currentUser: User) => {
    const requestKey = `profile-${currentUser.id}`;
    
    if (loadingRequests.current.has(requestKey)) {
      console.log('[UserProfile] Profile request already in progress, skipping duplicate');
      return;
    }

    if (profileAbortController.current) {
      profileAbortController.current.abort();
    }

    profileAbortController.current = new AbortController();
    const { signal } = profileAbortController.current;

    loadingRequests.current.add(requestKey);

    // --- Failsafe Implementation Start ---
    setIsStuck(false);
    failsafeTriggered.current = false; // Reset on new load attempt

    const timeoutId = setTimeout(() => {
      console.warn('[UserProfile] Profile load appears stuck – triggering failsafe');
      failsafeTriggered.current = true; // Mark that failsafe was the cause
      setIsStuck(true);
    
      if (profileAbortController.current) {
        profileAbortController.current.abort();
      }
    }, 15000);
    // --- Failsafe Implementation End ---

    try {
      setLoading(true);
      console.log('[UserProfile] Loading profile for user:', currentUser.id);
      
      const userProfile = await getUserProfile(currentUser.id, signal);
      
      if (!signal.aborted) {
        if (!userProfile) {
          console.error('[UserProfile] No profile found for user:', currentUser.id);
          setProfile(null);
          setRole(null);
        } else {
          setProfile(userProfile);
          setRole(userProfile.role);
          console.log('[UserProfile] Profile loaded successfully');
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
      clearTimeout(timeoutId);
      loadingRequests.current.delete(requestKey);
      
      // Only set loading to false if the failsafe didn't trigger
      if (!failsafeTriggered.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    console.log('[UserProfileContext] Forcing profile refresh...');
    try {
        // This will force a fetch, update the cache, and notify all subscribers,
        // including this context, to update their state automatically.
        await getUserProfile(user.id, undefined, true);
    } catch (error) {
        console.error('[UserProfileContext] Error refreshing profile:', error);
    }
  }, [user?.id]);

    const retryHistory = useCallback(async (overrideProfile?: UserProfile) => {
        if (!user?.id) return;
        const profileToUse = overrideProfile || profile;
        await loadEngagementHistory(user.id, profileToUse);
    }, [user?.id, profile, loadEngagementHistory]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('[UserProfile] Auth state changed:', event, session?.user?.email);

                const newUser = session?.user || null;

                if (event === 'INITIAL_SESSION' && newUser?.id === lastUserIdRef.current) {
                    console.log('[UserProfile] Skipping redundant INITIAL_SESSION');
                    setSessionLoading(false);
                    return;
                }

                cleanup();

                if (newUser) {
                    setUser(newUser);
                    setIsAuthenticated(true);
                    loadUserProfile(newUser); // No await
                    lastUserIdRef.current = newUser.id;
                } else {
                    setUser(null);
                    setProfile(null);
                    setEngagementHistory(null);
                    setRole(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                    setHistoryLoading(false);
                    setHistoryError(null);
                    lastUserIdRef.current = null;
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
    setIsStuck(false); // Also reset on logout
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
    isStuck,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
