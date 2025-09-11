import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/contexts/UserProfileContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import AuthDialog from "@/components/AuthDialog";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { user, profile, role, loading, logout } = useUserProfile();
    const [authLoading, setAuthLoading] = useState(false);
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);



    const handleSignOut = async () => {
        try {
            setAuthLoading(true);
            await logout();
            setAuthLoading(false);
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            setAuthLoading(false);
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
                        {role === "otwstaff" && (
                            <Badge variant="secondary" className="bg-blue-600 text-white text-xs ml-2">
                                OTW Staff
                            </Badge>
                        )}
                    </Link>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {loading || authLoading ? (
                            <div className="w-8 h-8 animate-pulse bg-gray-600 rounded-full"></div>
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                {/* Discovery Dashboard Link */}
                                <Link
                                        href="/discovery-dashboard"
                                    className="hidden sm:block text-sm font-medium hover:underline"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/discovery-dashboard"
                                    className="sm:hidden text-sm font-medium hover:underline"
                                >
                                    Dashboard
                                </Link>

                                {/* User Avatar */}
                                <Link href="/profile" passHref>
                                    <Avatar className="h-8 w-8 cursor-pointer border border-gray-600 hover:border-white transition">
                                        <AvatarImage src={profile?.avatar_url || ''} alt="User Avatar" />
                                        <AvatarFallback>
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>

                                {/* Logout */}
                                <button
                                    onClick={handleSignOut}
                                    className="text-sm text-gray-400 hover:text-white"
                                >
                                    <LogOut className="w-4 h-4 inline mr-1" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAuthDialogOpen(true)}
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
