
import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"; 
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import AuthDialog from "@/components/AuthDialog";
import { Badge } from "@/components/ui/badge";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {

    const supabase = useSupabaseClient();
    const user = useUser();
    const [loading, setLoading] = useState(false);


    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

    const [profileRole, setProfileRole] = useState < string | null > (null);

    useEffect(() => {
        if (!user) {
            setProfileRole(null);
            return;
        }

        const fetchRole = async () => {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("role")
                .eq("auth_id", user.id)
                .single();

            if (!error && data) setProfileRole(data.role);
        };

        fetchRole();
    }, [user, supabase]);
  

  // Global error handler to redirect to home on any errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      router.push("/").catch(() => {
        // If even the redirect fails, reload the page
        window.location.href = "/";
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      router.push("/").catch(() => {
        window.location.href = "/";
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [router]);

  const handleSignOut = async () => {
    try {

        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);

        router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      // On any error, redirect to index page
      router.push("/").catch(() => {
        window.location.href = "/";
      });
    }
  };

  const handleLoginClick = () => {
    setAuthDialogOpen(true);
  };

  const handleAuthClose = () => {
    setAuthDialogOpen(false);
  };

  // Auto-navigate to weekly-ratings after successful authentication from header
  useEffect(() => {
    if (user && !loading && isAuthDialogOpen) {
      setAuthDialogOpen(false);
      // Navigate to weekly-ratings page immediately after login
      setTimeout(() => {
        router.push("/weekly-ratings").catch((error) => {
          console.error("Navigation error after auth:", error);
          router.push("/");
        });
      }, 300);
    }
  }, [user, loading, isAuthDialogOpen, router]);

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
              priority
                      />
                      {profileRole === "otwstaff" && (
                          <Badge variant="secondary" className="bg-blue-600 text-white text-xs ml-2">
                              OTW Staff
                          </Badge>
                      )}
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-600 rounded"></div>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoginClick}
                className="gap-2 text-white border-white hover:bg-white hover:text-black bg-transparent"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col overflow-x-hidden min-h-0">
        {children}
      </main>

      {/* Auth Dialog for header login button */}
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onClose={handleAuthClose}
        title="Join OnesToWatch"
        description="Create your account to start earning rewards and voting on discoveries!"
      />
    </div>
  );
}