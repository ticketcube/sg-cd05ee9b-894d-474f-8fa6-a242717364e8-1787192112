import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-zinc-800 p-6">
                <WifiOff className="h-12 w-12 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                {isOnline ? "Back Online!" : "You're Offline"}
              </h1>
              <p className="text-zinc-400">
                {isOnline
                  ? "Your connection has been restored. Tap reload to continue."
                  : "Check your internet connection and try again."}
              </p>
            </div>

            {isOnline && (
              <Button 
                onClick={handleReload}
                className="w-full bg-white text-black hover:bg-zinc-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            )}

            <div className="pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                Some content may be available from cache while offline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}