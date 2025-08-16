
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/OTWLogocolor.png"
              alt="OnesToWatch"
              width={120}
              height={40}
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-white hover:text-black bg-transparent">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="gap-2 text-white border-white hover:bg-white hover:text-black bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-white hover:text-black bg-transparent">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-x-hidden min-h-0">
        {children}
      </main>
    </div>
  );
}
