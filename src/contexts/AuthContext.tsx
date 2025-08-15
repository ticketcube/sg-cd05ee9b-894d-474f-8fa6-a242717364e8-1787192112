import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import userProfileService, { UserProfile } from "@/services/userProfileService";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  sendOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, token: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const manageUserProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      try {
        let userProfile = await userProfileService.getUserProfile(currentUser.id);
        
        if (!userProfile) {
          console.log("No profile found, creating one for new user:", currentUser.email);
          const username = currentUser.email?.split("@")[0] || `user_${Date.now()}`;
          userProfile = await userProfileService.createUserProfile(
            currentUser.id,
            username,
            currentUser.email!
          );
        }

        if (userProfile) {
          setProfile(userProfile);
          setIsAdmin(userProfile.role === "admin");
          await userProfileService.updateLastActive(userProfile.id);
        }
      } catch (error) {
        console.error("Error managing user profile:", error);
        setProfile(null);
        setIsAdmin(false);
      }
    };
    
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      } else {
        const currentSession = data.session;
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        await manageUserProfile(currentUser);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await manageUserProfile(currentUser);
        if (_event !== "INITIAL_SESSION") {
            setLoading(false)
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string) => {
    return sendOtp(email);
  };
  
  const sendOtp = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  };
  
  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    // onAuthStateChange will handle profile creation/fetching.
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    login,
    logout,
    sendOtp,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
