import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading = () => {
  return (
    <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Dashboard...</p>
        </div>
    </div>
  );
};


