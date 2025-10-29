"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";

import { useUserProfile } from "@/contexts/UserProfileContext";
import { useMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AuthDialog from "@/components/AuthDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function UserNav() {
  const { user, profile, loading, logout } = useUserProfile();
  const isMobileHook = useMobile();
  const [mounted, setMounted] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setIsDropdownOpen(false);
      setIsSheetOpen(false);
      
      await logout();
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigationClick = () => {
    setIsDropdownOpen(false);
    setIsSheetOpen(false);
  };

  const getInitials = (email?: string) => {
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
        <>
            <div className="flex items-center gap-3">
                <Button onClick={() => setAuthDialogOpen(true)}>Login</Button>
            </div>

            <AuthDialog 
                isOpen={isAuthDialogOpen} 
                onClose={() => setAuthDialogOpen(false)}
                title="Join OnesToWatch"
                description="Create your account to start earning rewards and voting on discoveries!"
            />
        </>
    );
  }

  const menuItems = (
    <>
      <DropdownMenuItem asChild>
              <Link href="/september/rewards" onClick={handleNavigationClick}>Discover</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/discovery-dashboard" onClick={handleNavigationClick}>Rewards</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/profile" onClick={handleNavigationClick}>Wallet</Link>
      </DropdownMenuItem>
      {profile?.role === 'admin' && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/staffdashboard" onClick={handleNavigationClick} className="text-blue-600 font-medium">
              Staff Dashboard
            </Link>
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        onClick={handleLogout} 
        disabled={isLoggingOut}
        className="text-red-600 focus:text-red-600 cursor-pointer"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </DropdownMenuItem>
    </>
  );

  // Don't render responsive UI until mounted to prevent hydration mismatch
    if (!mounted) return null;
   

  // After mount, render responsive version
  if (isMobileHook) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-2 pt-4">
             <Link
               href="/september/rewards" 
               className="text-sm px-2 py-1.5 hover:bg-accent rounded-md"
               onClick={handleNavigationClick}
             >
               Discover
             </Link>
             <Link 
                        href="/discovery-dashboard" 
               className="text-sm px-2 py-1.5 hover:bg-accent rounded-md"
               onClick={handleNavigationClick}
             >
               Rewards
             </Link>
             <Link 
               href="/profile" 
               className="text-sm px-2 py-1.5 hover:bg-accent rounded-md"
               onClick={handleNavigationClick}
             >
                Tix & Merch
             </Link>
             {profile?.role === 'otwstaff' && (
               <>
                 <div className="border-b my-2"></div>
                 <Link 
                   href="/staffdashboard" 
                   className="text-sm px-2 py-1.5 hover:bg-accent rounded-md text-blue-600 font-medium"
                   onClick={handleNavigationClick}
                 >
                   Staff Dashb
                 </Link>
               </>
             )}
             <div className="border-b my-2"></div>
             <button 
               onClick={handleLogout} 
               disabled={isLoggingOut}
               className="text-sm px-2 py-1.5 hover:bg-accent rounded-md w-full text-left flex items-center text-red-600 disabled:opacity-50"
             >
               <LogOut className="mr-2 h-4 w-4" />
               {isLoggingOut ? "Logging out..." : "Logout"}
             </button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ""} alt={user.email || ""} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.username || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}