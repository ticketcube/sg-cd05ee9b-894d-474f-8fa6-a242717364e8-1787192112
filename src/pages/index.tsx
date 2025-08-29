
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
            className="bg-gradient-to-br from-green-600 to-blue-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group"
            onClick={() => handleNavigation("/discovery-dashboard")}
          >
                      return (
                      <main className="min-h-screen bg-black text-white overflow-x-hidden">
                          {/* Section 1: Video Hero / Intro */}
                          <section className="relative w-full h-screen flex flex-col items-center justify-center text-center">
                              <video
                                  className="absolute inset-0 w-full h-full object-cover"
                                  src="/intro-discovery.mp4"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                              />
                              <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90" />
                              <div className="relative z-10 px-6">
                                  <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
                                      Discover Tomorrow’s Stars
                                  </h1>
                                  <p className="text-gray-200 text-base md:text-xl mb-8">
                                      Explore fresh talent. Vote. Earn rewards. Be the first to spot what’s next.
                                  </p>
                                  <Button className="bg-gradient-to-r from-pink-500 to-yellow-400 text-black font-bold px-8 py-4 text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform">
                                      Start Discovering
                                  </Button>
                              </div>
                          </section>

                          {/* Section 2: Swipeable Feature Cards */}
                          <section className="py-12 px-4 bg-gradient-to-b from-black to-gray-900">
                              <div className="max-w-lg mx-auto space-y-8">
                                  {/* Card 1 */}
                                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-xl text-center hover:scale-[1.02] transition-transform">
                                      <TrendingUp className="w-10 h-10 mx-auto mb-4" />
                                      <h2 className="text-2xl font-bold mb-2">Discovery Charts</h2>
                                      <p className="text-gray-200 text-sm mb-4">
                                          See which artists are rising fastest, powered by community votes.
                                      </p>
                                      <Button className="w-full bg-white text-purple-700 font-semibold py-3 rounded-xl">
                                          Explore Charts
                                      </Button>
                                  </div>

                                  {/* Card 2 */}
                                  <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 shadow-xl text-center hover:scale-[1.02] transition-transform">
                                      <Trophy className="w-10 h-10 mx-auto mb-4" />
                                      <h2 className="text-2xl font-bold mb-2">Weekly Rewards</h2>
                                      <p className="text-gray-100 text-sm mb-4">
                                          Vote each week and collect points for exclusive rewards.
                                      </p>
                                      <Button className="w-full bg-black text-green-400 font-semibold py-3 rounded-xl border border-green-400">
                                          Start Earning
                                      </Button>
                                  </div>

                                  {/* Card 3 */}
                                  <div className="bg-gradient-to-br from-pink-500 to-orange-400 rounded-2xl p-6 shadow-xl text-center hover:scale-[1.02] transition-transform">
                                      <Music className="w-10 h-10 mx-auto mb-4" />
                                      <h2 className="text-2xl font-bold mb-2">Exclusive Access</h2>
                                      <p className="text-gray-100 text-sm mb-4">
                                          Unlock tickets, meet & greets, and behind-the-scenes experiences.
                                      </p>
                                      <Button className="w-full bg-white text-pink-600 font-semibold py-3 rounded-xl">
                                          Unlock Rewards
                                      </Button>
                                  </div>
                              </div>
                          </section>

                          {/* Section 3: CTA Banner */}
                          <section className="py-20 px-6 bg-gradient-to-r from-yellow-400 to-pink-500 text-black text-center">
                              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Join the Movement</h2>
                              <p className="text-lg mb-8">Be the first to discover what’s next in music and culture.</p>
                              <Button className="bg-black text-white font-bold px-8 py-4 text-lg rounded-2xl hover:bg-gray-800">
                                  Sign Up Now
                              </Button>
                          </section>

          
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