import { useUser } from "@supabase/auth-helpers-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";
import AuthDialog from "@/components/AuthDialog";
import { useState } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const user = useUser();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

  const handleLoginClick = () => {
    setAuthDialogOpen(true);
  };

  const handleAuthClose = () => {
    setAuthDialogOpen(false);
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Authentication Required</h1>
            <p className="text-neutral-600 mb-6">
              Please sign in to access this page and start earning rewards.
            </p>
            <Button 
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        </div>
        
        <AuthDialog 
          isOpen={isAuthDialogOpen} 
          onClose={handleAuthClose}
          title="Sign In Required"
          description="Create your account to access this feature and start earning rewards!"
        />
      </>
    );
  }

  return <>{children}</>;
}