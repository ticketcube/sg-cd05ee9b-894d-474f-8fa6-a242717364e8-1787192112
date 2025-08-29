
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Music, Settings, BarChart } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { useState, useEffect } from "react";
import PromotionPopup from "@/components/PromotionPopup";

const showDiscoveryCharts = false;

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [showPromotionAuthDialog, setShowPromotionAuthDialog] = useState(false);

  // Handle any routing errors by staying on index
  useEffect(() => {
    const handleRouteChangeError = () => {
      router.push("/");
    };

    router.events.on('routeChangeError', handleRouteChangeError);
    return () => {
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  const handleNavigation = async (path: string) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    
    try {
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // Stay on current page if navigation fails
    }
  };

  const handleRegisterClick = () => {
    setShowPromotionAuthDialog(true);
  };
  
  const handleAuthClose = () => {
    setAuthDialogOpen(false);
  };

  const handlePromotionAuthClose = () => {
    setShowPromotionAuthDialog(false);
  };

 
  
  return (
    <div className="flex-grow bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome message for logged in users */}
        {user && (
          <div className="text-center mb-8">
            <p className="text-purple-200">
              Welcome back, {user.username || 'User'}!
            </p>
          </div>
        )}

        {/* Main Navigation Cards */}
        <div
          className={`max-w-4xl mx-auto grid ${showDiscoveryCharts ? "md:grid-cols-2" : "md:grid-cols-1"
            } gap-4 md:gap-8`}
        >
          {/* Weekly Rewards Card */}
                  <Card
                      className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 border-0 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-500 cursor-pointer group"
                      onClick={() => handleNavigation("/discovery-dashboard")}
                  >
                      {/* Optional background video overlay */}
                      <video
                          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                          src="/intro-discovery.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

                      <CardContent className="relative z-10 p-6 md:p-10 h-full flex flex-col justify-between text-center">
                          <div>
                              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
                                  Discover Tomorrow’s Stars
                              </h1>
                              <h2 className="text-lg md:text-2xl font-semibold mb-4 text-pink-200">
                                  We Reward Discovery
                              </h2>
                              <p className="text-white/90 mb-6 text-sm md:text-base">
                                  Vote weekly, climb the charts, and unlock exclusive rewards for spotting the next big thing.
                              </p>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold py-3 md:py-4 text-lg md:text-xl rounded-xl shadow-md hover:scale-105 transition-transform">
                              {user ? "Earn More Rewards!" : "Start Earning Rewards!"}
                          </Button>
                      </CardContent>
                  </Card>
          
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-8 md:mt-16">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2" />
            <span className="text-gray-400 text-sm md:text-base">Powered by community votes and engagement</span>
          </div>
        </div>
      </div>

         
      
      {/* Auth Dialog for protected navigation */}
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onClose={handleAuthClose}
        title="Join OnesToWatch"
        
      />
    </div>
  );
}