
// src/contexts/UserProfileContext.tsx
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { authService } from "@/services/authService";

type UserProfile = {
    id: number;                    // ✅ FIXED: integer, not string
    user_id: string;              // ✅ CORRECT: uuid
    username: string;             // ✅ CORRECT: required text
    role?: string;                // ✅ CORRECT: optional text
    email: string;                // ✅ CORRECT: required text
    raw_city_input?: string;      // ✅ CORRECT: optional text
    avatar_url?: string;          // ✅ CORRECT: optional text
    created_at: string;           // ✅ CORRECT: required timestamp
    total_points?: number;        // ✅ FIXED: number, not string, and correct name
    last_active?: string;         // ✅ ADDED: missing field
    city_id?: number;             // ✅ ADDED: missing bigint field
};

type UserProfileContextType = {
    profile: UserProfile | null;
    role: string | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    refreshProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(
    undefined
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const fetchProfile = useCallback(async () => {
        console.log('🔄 [UserProfileContext] fetchProfile called, user:', user?.id);
        
        if (!user) {
            console.log('❌ [UserProfileContext] No user found');
            setProfile(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setIsAuthenticated(true); // ✅ User exists = authenticated

            console.log('🔍 [UserProfileContext] Fetching profile for user:', user.id);

            // ✅ FIXED: Use direct Supabase query for immediate results
            const { data: profileData, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // Profile doesn't exist yet - this is normal for very new users
                    console.log('⚠️ [UserProfileContext] Profile not found for user:', user.id);
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                throw fetchError;
            }

            console.log('✅ [UserProfileContext] Profile loaded successfully:', profileData);
            setProfile(profileData as UserProfile);
        } catch (err: any) {
            console.error("❌ [UserProfileContext] Error loading profile:", err.message);
            setError(err.message || 'Failed to load profile');
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // ✅ ENHANCED: Listen to auth state changes for OAuth flows
    useEffect(() => {
        console.log('🎯 [UserProfileContext] Auth state changed. User:', user?.id);
        
        if (user) {
            // Small delay to ensure OAuth session is fully established
            const timer = setTimeout(fetchProfile, 100);
            return () => clearTimeout(timer);
        } else {
            setProfile(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    }, [user, fetchProfile]);

    // ✅ NEW: Listen to auth state changes directly from Supabase
    useEffect(() => {
        console.log('🔗 [UserProfileContext] Setting up auth listener');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 [UserProfileContext] Auth event:', event, 'Session user:', session?.user?.id);
                
                if (event === 'SIGNED_IN' && session?.user) {
                    // Force refresh profile on sign in
                    setIsAuthenticated(true);
                    // Small delay to ensure session is fully established
                    setTimeout(fetchProfile, 200);
                } else if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            }
        );

        return () => {
            console.log('🔌 [UserProfileContext] Cleaning up auth listener');
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const value: UserProfileContextType = {
        profile,
        role: profile?.role ?? null,
        loading,
        error,
        isAuthenticated,
        refreshProfile: fetchProfile,
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error("useUserProfile must be used within a UserProfileProvider");
    }
    return context;
}
