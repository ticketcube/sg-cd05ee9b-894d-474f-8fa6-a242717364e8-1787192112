import { supabase } from "@/integrations/supabase/client";
import type { User, AuthError } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface OAuthRedirectOptions {
  redirectTo?: string;
}

class AuthService {
  async signInWithGoogle(options: OAuthRedirectOptions = {}): Promise<{ error: AuthError | null }> {
    const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback`;
    
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

async signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  
  // Clear profile cache on sign out
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('userProfile:')) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('[AuthService] Cleared all profile caches on sign out');
  } catch (cacheError) {
    console.warn('[AuthService] Error clearing cache on sign out:', cacheError);
  }
  
  return { error };
}

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
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
    return supabase.auth.getUser() !== null;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data !== null;
    } catch (error) {
      console.error('Error checking username:', error);
      throw error;
    }
  }

  validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { isValid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters' };
    }

    if (trimmed.length > 30) {
      return { isValid: false, error: 'Username must be less than 30 characters' };
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    return { isValid: true };
  }
}

export const authService = new AuthService();