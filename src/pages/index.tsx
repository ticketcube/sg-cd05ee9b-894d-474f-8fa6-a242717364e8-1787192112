
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Music, User, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import AuthDialog from "@/components/AuthDialog";
import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

  const handleNavigation = (path: string) => {
    if (!isAuthenticated) {
      setAuthDialogOpen(true);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    logout();
    // Optional: redirect to home or show a message
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              OTW CHART
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Discover, Vote & Earn Rewards
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <Link href="/profile" passHref>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {user.username}
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleLogout} size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setAuthDialogOpen(true)}>
                    Login
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Weekly Rewards Card */}
          <Card 
            className="bg-gradient-to-br from-green-600 to-blue-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group"
            onClick={() => handleNavigation("/weekly")}
          >
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                  Weekly Rewards
                </h2>
                <p className="text-center text-white/90 mb-6">
                  Vote on weekly artist discoveries and earn points for exclusive rewards
                </p>
                <ul className="space-y-2 text-sm text-white/80 mb-6">
                  <li>• Earn 5 points for watching videos</li>
                  <li>• Earn 10 points for submitting votes</li>
                  <li>• Bonus points for complete participation</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 text-lg"
              >
                Start Earning Rewards
              </Button>
            </CardContent>
          </Card>

          {/* Discovery Charts Card */}
          <Card 
            className="bg-gradient-to-br from-purple-600 to-pink-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group"
            onClick={() => handleNavigation("/discovery-charts")}
          >
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                  Discovery Charts
                </h2>
                <p className="text-center text-white/90 mb-6">
                  Explore comprehensive artist rankings and genre-based charts
                </p>
                <ul className="space-y-2 text-sm text-white/80 mb-6">
                  <li>• Top 100 artists of the decade</li>
                  <li>• Complete artist database (750+)</li>
                  <li>• Genre-specific rankings</li>
                </ul>
              </div>
              <Button 
                className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold py-4 text-lg"
              >
                Explore Charts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-6 h-6 text-blue-400 mr-2" />
            <span className="text-gray-400">Powered by community votes and engagement</span>
          </div>
        </div>
      </div>
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </main>
  );
}
