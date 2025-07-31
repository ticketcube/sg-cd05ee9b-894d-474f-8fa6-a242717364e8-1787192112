
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Database, Music2 } from "lucide-react";
import { useRouter } from "next/router";
import AuthGuard from "@/components/AuthGuard";

export default function DiscoveryChartsPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Discovery Charts
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Explore Artist Rankings & Genre Charts
            </p>
          </div>

          {/* Chart Navigation Cards */}
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {/* 10 Year Top 100 */}
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                    10 Year Top 100
                  </h2>
                  <p className="text-center text-white/90 mb-6">
                    The definitive ranking of the top 100 artists from the past decade
                  </p>
                  <ul className="space-y-2 text-sm text-white/80 mb-6">
                    <li>• Community-voted rankings</li>
                    <li>• Detailed artist profiles</li>
                    <li>• Interactive voting system</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => handleNavigation("/top100")}
                  className="w-full bg-white text-orange-600 hover:bg-gray-100 font-bold py-3"
                >
                  View Top 100
                </Button>
              </CardContent>
            </Card>

            {/* 10 Year All 750 */}
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                    10 Year All 750
                  </h2>
                  <p className="text-center text-white/90 mb-6">
                    Complete database of all 750+ artists from the past decade
                  </p>
                  <ul className="space-y-2 text-sm text-white/80 mb-6">
                    <li>• Comprehensive artist database</li>
                    <li>• Advanced search & filtering</li>
                    <li>• Complete artist histories</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => handleNavigation("/all-artists")}
                  className="w-full bg-white text-cyan-600 hover:bg-gray-100 font-bold py-3"
                >
                  Explore All Artists
                </Button>
              </CardContent>
            </Card>

            {/* Groover Chart */}
            <Card className="bg-gradient-to-br from-green-500 to-teal-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform">
                    <Music2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                    Groover Chart
                  </h2>
                  <p className="text-center text-white/90 mb-6">
                    Discover artists by genre and musical style preferences
                  </p>
                  <ul className="space-y-2 text-sm text-white/80 mb-6">
                    <li>• Genre-based categorization</li>
                    <li>• Style-specific rankings</li>
                    <li>• Curated music discovery</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => handleNavigation("/genres")}
                  className="w-full bg-white text-teal-600 hover:bg-gray-100 font-bold py-3"
                >
                  Browse Genres
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center mb-4">
              <Music2 className="w-6 h-6 text-purple-400 mr-2" />
              <span className="text-gray-400">Dive deep into music discovery and artist exploration</span>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
