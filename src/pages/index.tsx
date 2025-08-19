
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Music } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { useState, useEffect } from "react";
import PromotionPopup from "@/components/PromotionPopup";

const showDiscoveryCharts = false; <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
    <User className="w-8 h-8 text-white" />
</div>continue

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

  // If user just logged in, automatically navigate to weekly-ratings
  useEffect(() => {
    if (user && !loading && isAuthDialogOpen) {
      setAuthDialogOpen(false);
      // Small delay to ensure state is settled, then navigate
      setTimeout(() => {
        router.push("/weekly-ratings");
      }, 300);
    }
  }, [user, loading, isAuthDialogOpen, router]);
  
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
            className="bg-gradient-to-br from-green-600 to-blue-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group"
            onClick={() => handleNavigation("/weekly-ratings")}
          >
            <CardContent className="p-4 md:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full mb-3 md:mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-2 md:mb-4">
                  We Reward Discovery
                </h2>
                <p className="text-center text-white/90 mb-4 md:mb-6 text-sm md:text-base">
                  Vote on weekly artist discoveries and earn points for exclusive rewards
                </p>
              </div>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold py-2 md:py-4 text-base md:text-lg">
                {user ? "Earn More Rewards!" : "Start Earning Rewards"}
              </Button>
            </CardContent>
          </Card>

          {/* Discovery Charts Card (only if enabled) */}
          {showDiscoveryCharts && (
            <Card
              className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group"
              onClick={() => handleNavigation("/discovery-charts")}
            >
              <CardContent className="p-4 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full mb-3 md:mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-2 md:mb-4">
                    Discovery Charts
                  </h2>
                  <p className="text-center text-white/90 mb-4 md:mb-6 text-sm md:text-base">
                    Explore comprehensive artist rankings and genre-based charts
                  </p>
                </div>
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold py-2 md:py-4 text-base md:text-lg">
                  Explore Charts
                </Button>
              </CardContent>
            </Card>
          )}
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
        description="Create your account to vote on discoveries and earn rewards!"
      />
      
      {/* Promotional Popup for new users */}
      <PromotionPopup onRegisterClick={handleRegisterClick} />
      
      {/* Auth Dialog for the promotional popup */}
      <AuthDialog 
        isOpen={showPromotionAuthDialog} 
        onClose={handlePromotionAuthClose}
        title="Get Local Events & Rewards"
        description="Register to see events in your city and earn rewards!"
      />
    </div>
  );
}