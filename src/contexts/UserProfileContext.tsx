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
    id: string;
    auth_id: string;
    username?: string;
    role?: string;
    email?: string;
    raw_city_input?: string;
    avatar_url?: string;
    created_at?: string;
    city?: string;
    state?: string;
    // add other fields from your user_profiles table
};

type UserProfileContextType = {
    profile: UserProfile | null;
    role: string | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
};

const UserProfileContext = createContext < UserProfileContextType | undefined > (
    undefined
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [profile, setProfile] = useState < UserProfile | null > (null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("auth_id", user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (err: any) {
            console.error("Error loading profile:", err.message);
            setError(err.message);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [supabase, user]);

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