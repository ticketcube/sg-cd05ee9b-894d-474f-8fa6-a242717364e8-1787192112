"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { useUserProfile } from "@/contexts/UserProfileContext";
import { useMobile } from "@/hooks/use-mobile";
import { authService } from "@/services/authService";

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

export default function UserNav() {
  const { user, profile, loading } = useUserProfile();
  const isMobile = useMobile();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleLogout = async () => {
    await authService.signOut();
    // Redirect or state update will be handled by the UserProfileContext
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
        <Button onClick={() => setShowAuthDialog(true)}>Login</Button>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </>
    );
  }

  const menuItems = (
    <>
      <DropdownMenuItem asChild>
        <Link href="/discovery-dashboard">Discover</Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/profile">Profile</Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        Logout
      </DropdownMenuItem>
    </>
  );

  if (isMobile) {
    return (
      <Sheet>
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
              {/* This mimics DropdownMenuItem styling/behavior for consistency */}
             <Link href="/discovery-dashboard" className="text-sm px-2 py-1.5 hover:bg-accent rounded-md">Discover</Link>
             <Link href="/profile" className="text-sm px-2 py-1.5 hover:bg-accent rounded-md">Profile</Link>
             <div className="border-b my-2"></div>
             <button onClick={handleLogout} className="text-sm px-2 py-1.5 hover:bg-accent rounded-md w-full text-left">Logout</button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu>
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