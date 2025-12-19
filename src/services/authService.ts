import { supabase } from "@/integrations/supabase/client";
import type { User, AuthError } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface OAuthRedirectOptions {
  redirectTo?: string;
}

// Utility to get the redirect URL, ensuring it's a valid absolute URL.
const getRedirectURL = (path = "/auth/callback") => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Provided by Vercel
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Provided by Vercel
    "http://localhost:3000";

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  // Append the path
  url = `${url}${path.replace(/^\//, "")}`;

  return url;
};

class AuthService {
  async signInWithGoogle(options: OAuthRedirectOptions = {}): Promise<{ error: AuthError | null }> {
    const redirectTo = options.redirectTo || getRedirectURL("discovery-dashboard");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error };
  }

  async signInWithApple(options: OAuthRedirectOptions = {}): Promise<{ error: AuthError | null }> {
    const redirectTo = options.redirectTo || getRedirectURL("discovery-dashboard");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo,
      },
    });
    if (error) {
      console.error("Error signing in with Apple:", error.message);
    }
    return { error };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    
    // Clear profile cache on sign out
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith("userProfile:")) {
          sessionStorage.removeItem(key);
        }
      });
      console.log("[AuthService] Cleared all profile caches on sign out");
    } catch (cacheError) {
      console.warn("[AuthService] Error clearing cache on sign out:", cacheError);
    }
    
    return { error };
  }

  async getCurrentUser(): Promise<User | null> {
    const userResponse = await supabase.auth.getUser();
    if (userResponse.error) {
      console.error("Error fetching user:", userResponse.error.message);
      return null;
    }
    return userResponse.data.user;
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async refreshSession() {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    return { session, error };
  }

  isAuthenticated(): boolean {
    // This sync method is not reliable and should be avoided.
    // It is functionally incorrect as it attempts to synchronously call an async function.
    // It is preserved to avoid breaking callsites, but it will always return false.
    // Prefer using the async `getSession()` or `getUser()` methods.
    return false;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116: "exact one row not found"
        throw error;
      }

      return data !== null;
    } catch (error) {
      console.error("Error checking username:", error);
      throw error;
    }
  }

  validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: "Username is required" };
    }

    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { isValid: false, error: "Username must be at least 3 characters" };
    }

    if (trimmed.length > 30) {
      return { isValid: false, error: "Username must be less than 30 characters" };
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      return { isValid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
    }

    return { isValid: true };
  }
}

export const authService = new AuthService();