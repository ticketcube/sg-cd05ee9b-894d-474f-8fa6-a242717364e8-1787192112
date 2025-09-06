// src/contexts/UserProfileContext.tsx
import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

// Define the shape of the user profile data
export type UserProfile = {
    id: number;
    user_id: string;
    username: string;
    role?: string;
    email: string;
    raw_city_input?: string; // ADDED
    avatar_url?: string;
    created_at: string;
    total_points?: number;
};

// Define the shape of the context value
type UserProfileContextType = {
    profile: UserProfile | null;
    role: string | null; // ADDED
    loading: boolean;
    isAuthenticated: boolean;
    refreshProfile: () => void;
};

const UserProfileContext = createContext < UserProfileContextType | undefined > (
    undefined
);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const supabase = useSupabaseClient();
    const user = useUser(); // The user object from Supabase auth

    const [profile, setProfile] = useState < UserProfile | null > (null);
    const [loading, setLoading] = useState(true); // Start as true

    // This is the core profile fetching logic
    const fetchProfile = useCallback(async () => {
        if (!user) {
            // If there's no user, there's no profile to fetch.
            setProfile(null);
            setLoading(false);
            return;
        }

        // A user exists, so let's try to fetch their profile.
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error) {
                // This can happen if the database trigger hasn't created the profile yet.
                console.warn("[UserProfileContext] Profile not found, could be a new user:", error.message);
                setProfile(null); // Explicitly set profile to null on error
            } else {
                setProfile(data as UserProfile);
            }
        } catch (err: any) {
            console.error("[UserProfileContext] Error fetching profile:", err.message);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // The main effect hook that listens to authentication state changes.
    useEffect(() => {
        // Immediately try to fetch the profile when the component mounts or user changes.
        fetchProfile();

        // Listen for SIGNED_IN and SIGNED_OUT events from Supabase.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[UserProfileContext] Auth Event: ${event}`);
            if (event === "SIGNED_IN") {
                // The user object is now available, let's ensure we fetch the profile.
                // A small delay can help if the session needs a moment to be fully available.
                setTimeout(() => fetchProfile(), 100);
            } else if (event === "SIGNED_OUT") {
                setProfile(null);
                setLoading(false);
            }
        });

        // Cleanup the subscription when the component unmounts.
        return () => {
            subscription.unsubscribe();
        };
    }, [user, supabase, fetchProfile]);

    const value: UserProfileContextType = {
        profile,
        loading,
        role: profile?.role ?? null, // ADDED
        isAuthenticated: !!user, // CHANGED
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