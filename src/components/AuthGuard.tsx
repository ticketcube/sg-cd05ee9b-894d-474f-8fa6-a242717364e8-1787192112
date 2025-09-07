import { useUserProfile } from "@/contexts/UserProfileContext";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
    children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, profile, loading } = useUserProfile();

    // While the session and profile are loading, show a full-screen loading indicator.
    // This is the crucial step to prevent the "login required" page from flashing.
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading your session...</p>
                </div>
            </div>
        );
    }

    // If loading is complete and there is still no user, we can assume they are not logged in.
    // The pages this guard protects are responsible for showing a login prompt.
    // We just render the children, which will handle the prompt.
    if (!user) {
        return <>{children}</>;
    }

    // Edge case: User is authenticated, but the profile hasn't been created in our DB yet.
    if (user && !profile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Finalizing your profile setup...</p>
                </div>
            </div>
        );
    }

    // If loading is complete, and we have a user and a profile, render the protected content.
    return <>{children}</>;
}