import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile, getUserProfile } from '@/services/userProfileService';

interface UserProfileContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    isAdmin: boolean;
    isAuthenticated: boolean;
    role: string | null;
    refreshProfile: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const userProfile = await getUserProfile(user.id);
            setProfile(userProfile);
            setIsAdmin(userProfile?.role === 'otwstaff');
        } catch (profileError) {
            console.error("Error refreshing user profile:", profileError);
            setProfile(null);
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const getSessionAndProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user) {
                    setUser(session.user);
                    const userProfile = await getUserProfile(session.user.id);
                    if (!isMounted) return;
                    setProfile(userProfile);
                    setIsAdmin(userProfile?.role === 'otwstaff');
                } else {
                    setUser(null);
                    setProfile(null);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("Error loading session/profile:", err);
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setIsAdmin(false);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        getSessionAndProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                try {
                    const userProfile = await getUserProfile(session.user.id);
                    if (!isMounted) return;
                    setProfile(userProfile);
                    setIsAdmin(userProfile?.role === 'otwstaff');
                } catch (profileError) {
                    console.error("Error fetching user profile on auth change:", profileError);
                    if (isMounted) {
                        setProfile(null);
                        setIsAdmin(false);
                    }
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    setProfile(null);
                    setIsAdmin(false);
                }
            }
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []); // 👈 run once only (no [user] dep)


    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
    };

    const value = {
        user,
        profile,
        loading,
        isAdmin,
        isAuthenticated: !!user,
        role: profile?.role || null,
        refreshProfile,
        logout,
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

// Export UserProfile type for components that need it
export type { UserProfile };

// Kept for backwards compatibility if other components use it, but useUserProfile is preferred
export const useAuth = () => {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a UserProfileProvider');
    }
    return context;
};
