import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { userProfileService } from "@/services/userProfileService";

export interface User {
  id: number;
  username: string;
  email: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage on mount
    const storedUser = localStorage.getItem("otwchart_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("otwchart_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, email: string) => {
    try {
      const userProfile = await userProfileService.createOrUpdateUserProfile({
        username: username.trim(),
        email: email.trim()
      });
      
      const userData: User = {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        points: userProfile.total_points || 0
      };
      
      setUser(userData);
      localStorage.setItem("otwchart_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Failed to login. Please try again.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("otwchart_user");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
