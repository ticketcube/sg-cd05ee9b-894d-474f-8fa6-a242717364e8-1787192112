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

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // ✅ FIXED: Use direct Supabase query instead of API endpoint
            // This eliminates race conditions and network delays
            const { data: profileData, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // Profile doesn't exist yet - this is normal for very new users
                    console.log('Profile not found for user:', user.id);
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                throw fetchError;
            }

            setProfile(profileData as UserProfile);
        } catch (err: any) {
            console.error("Error loading profile:", err.message);
            setError(err.message || 'Failed to load profile');
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const value: UserProfileContextType = {
        profile,
        role: profile?.role ?? null,
        loading,
        error,
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