
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
                      className="relative overflow-hidden bg-transparent border-0 rounded-3xl shadow-lg hover:rotate-1 hover:scale-105 transition-transform duration-500 cursor-pointer group"
                      onClick={() => handleNavigation("/discovery-dashboard")}
                  >
                      {/* Gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-300" />

                      {/* Paint splatter texture */}
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paint.png')] mix-blend-overlay" />

                      <CardContent className="relative p-6 md:p-10 h-full flex flex-col justify-between z-10">
                          <div>
                              <div className="flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-white/40 rounded-full mb-5 mx-auto group-hover:rotate-12 transition-transform">
                                  <Trophy className="w-7 h-7 md:w-10 md:h-10 text-purple-900" />
                              </div>
                              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-3 text-purple-900 drop-shadow-md">
                                  We Reward Discovery
                              </h2>
                              <p className="text-center text-purple-800/80 mb-6 text-base md:text-lg italic">
                                  Cast your vote for emerging artists and unlock creative rewards.
                              </p>
                          </div>
                          <Button className="w-full bg-purple-900 text-yellow-300 font-bold py-3 md:py-4 text-lg rounded-xl hover:bg-purple-800 hover:scale-105 transition">
                              {user ? "Fuel Your Creativity 🎭" : "Start Creating 🎨"}
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