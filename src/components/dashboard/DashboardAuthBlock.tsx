import React from 'react';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/AuthDialog';

interface DashboardAuthBlockProps {
  showAuthDialog: boolean;
  setShowAuthDialog: (show: boolean) => void;
}

export default function DashboardAuthBlock = ({ showAuthDialog, setShowAuthDialog }: DashboardAuthBlockProps) => {
  return (
    <>
      <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center gap-4 text-center bg-black p-4">
          <h2 className="text-2xl font-bold text-white">Access Restricted</h2>
          <p className="max-w-md text-muted-foreground">
              You need to be signed in to view the Discovery Dashboard. Please sign in to continue.
          </p>
          <Button onClick={() => setShowAuthDialog(true)}>Sign In</Button>
      </div>
     <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </>
  );
};


