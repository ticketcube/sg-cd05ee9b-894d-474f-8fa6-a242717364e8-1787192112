import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, Music, Users, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleArtistsClick = () => {
    alert("Coming soon! Artist features are currently in development.");
  };

  return (
    <>
      <Head>
        <title>OnesToWatch - Watch Videos, Earn Rewards</title>
        <meta
          name="description"
          content="Discover emerging artists, earn rewards, and shape the future of music."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            {/* Main Heading - Above everything */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Watch Videos.
                <br />
                Earn Rewards.
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Discover emerging artists, shape the future of music, and get rewarded for your taste.
              </p>
            </div>

            {/* Mobile: Video First, Then Buttons */}
            <div className="lg:hidden space-y-6">
              {/* Video on Mobile */}
              <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src="https://cdn.brandfolder.io/364H2QNG/as/n56ftqn44kcpxgt6xgbfwqt9/AR_RRP.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg transition-all"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>

              {/* Three Buttons - Equal Size on Mobile */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/50 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">For Fans</h3>
                    <p className="text-gray-300 text-sm">
                      Discover new artists, rate music, and earn rewards
                    </p>
                  </div>
                </div>
                <Link href="/newsletter" className="w-full">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4">
                    Get Started
                  </Button>
                </Link>
              </Card>

              <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border-pink-500/50 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">For Artists</h3>
                    <p className="text-gray-300 text-sm">
                      Get discovered by fans who love finding new music first
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleArtistsClick}
                  className="w-full bg-pink-500/50 hover:bg-pink-500/70 text-white font-semibold py-4 cursor-not-allowed"
                >
                  Coming Soon
                </Button>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">For OTW Curators</h3>
                    <p className="text-gray-300 text-sm">
                      Access your curator dashboard and manage content
                    </p>
                  </div>
                </div>
                <Link href="/staffdashboard" className="w-full">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4">
                    Staff Dashboard
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Desktop: Golden Ratio Layout (38% Buttons / 62% Video) */}
            <div className="hidden lg:grid lg:grid-cols-[38fr_62fr] gap-8 items-stretch">
              {/* Left Side - Three Stacked Buttons (Match Video Height) */}
              <div className="flex flex-col gap-4">
                {/* For Fans */}
                <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/50 p-6 hover:scale-105 transition-transform flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">For Fans</h3>
                      <p className="text-gray-300 text-xs leading-tight">
                        Discover new artists, rate music, and earn rewards
                      </p>
                    </div>
                  </div>
                  <Link href="/newsletter" className="w-full mt-auto">
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3">
                      Get Started
                    </Button>
                  </Link>
                </Card>

                {/* For Artists */}
                <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border-pink-500/50 p-6 hover:scale-105 transition-transform flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">For Artists</h3>
                      <p className="text-gray-300 text-xs leading-tight">
                        Get discovered by fans who love finding new music first
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleArtistsClick}
                    className="w-full bg-pink-500/50 hover:bg-pink-500/70 text-white font-semibold py-3 cursor-not-allowed mt-auto"
                  >
                    Coming Soon
                  </Button>
                </Card>

                {/* For OTW Curators */}
                <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50 p-6 hover:scale-105 transition-transform flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">For OTW Curators</h3>
                      <p className="text-gray-300 text-xs leading-tight">
                        Access your curator dashboard and manage content
                      </p>
                    </div>
                  </div>
                  <Link href="/staffdashboard" className="w-full mt-auto">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3">
                      Staff Dashboard
                    </Button>
                  </Link>
                </Card>
              </div>

              {/* Right Side - Video (Golden Ratio: 62%) */}
              <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src="https://cdn.brandfolder.io/364H2QNG/as/n56ftqn44kcpxgt6xgbfwqt9/AR_RRP.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full shadow-lg transition-all"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Stats Section - Below the main content */}
            <div className="mt-16 text-center">
              <p className="text-gray-400 text-lg mb-4">
                Join thousands of music fans discovering the next big artists
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">750+</div>
                  <div>Artists Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">50K+</div>
                  <div>Fans Reached</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">5K+</div>
                  <div>Active Discoverers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center space-y-4">
            <p className="text-gray-500 text-sm">
              BY CONTINUING PAST THIS PAGE YOU AGREE TO OUR{" "}
              <Link href="/termsofservice" className="underline hover:text-gray-400 transition-colors">
                TERMS OF USE
              </Link>
              {" & "}
              <Link href="/privacypolicy" className="underline hover:text-gray-400 transition-colors">
                PRIVACY POLICY
              </Link>
            </p>
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} OTW Chart. Discover music, shape culture.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}