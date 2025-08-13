
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Music, User, LogOut, UploadCloud } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PromotionPopup from "@/components/PromotionPopup";

const showDiscoveryCharts = false;

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [showPromotionAuthDialog, setShowPromotionAuthDialog] = useState(false);

  const handleNavigation = (path: string) => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleRegisterClick = () => {
    setShowPromotionAuthDialog(true);
  };

  const handleAuthClose = () => {
    setShowPromotionAuthDialog(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 md:mb-12">
          <div className="text-left">
            <div className="flex items-center mb-2">
              <Image
                src="/OTWLogocolor.png"
                alt="OnesToWatch"
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto"
              />
            </div>
           
          </div>
          {/* Mobile-responsive user section */}
          <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-4">
            {!loading && (
              <>
                {isAuthenticated && user ? (
                  <>
                  
                    <Link href="/profile" passHref>
                      <Button variant="ghost" className="flex items-center gap-2 text-sm md:text-base">
                        <User className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="truncate max-w-[100px] md:max-w-none">{user.username}</span>
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleLogout} 
                      size="sm" 
                      className="bg-transparent border border-white text-white hover:bg-white hover:text-black transition-colors text-xs md:text-sm"
                    >
                      <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setAuthDialogOpen(true)} size="sm" className="text-sm">
                    Login
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

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
                                Start Earning Rewards
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
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      
      {/* Promotional Popup for new users */}
      <PromotionPopup onRegisterClick={handleRegisterClick} />
      
      {/* Auth Dialog for the promotional popup */}
      <AuthDialog 
        isOpen={showPromotionAuthDialog} 
        onClose={handleAuthClose}
        title="Get Local Events & Rewards"
        description="Register to see events in your city and earn rewards!"
      />
    </main>
  );
}