import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { 
  Music, 
  Star, 
  Trophy, 
  Smartphone, 
  Zap, 
  TrendingUp,
  Download,
  Share2,
  Check,
  Sparkles,
  Users,
  Award,
  Volume2,
  VolumeX
} from "lucide-react";

export default function DownloadPage() {
  const { isInstallable: canInstall, promptInstall, isInstalled } = usePWAInstall();
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios");
    } else if (/android/.test(userAgent)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  const handleInstallClick = () => {
    if (deviceType === "ios") {
      setShowIOSInstructions(true);
    } else if (canInstall) {
      promptInstall();
    } else {
      window.location.href = "/";
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const features = [
    {
      icon: Music,
      title: "Discover First",
      description: "Get early access to emerging artists before they blow up",
      color: "text-purple-500"
    },
    {
      icon: Star,
      title: "Rate & Influence",
      description: "Your ratings help shape the next generation of music stars",
      color: "text-yellow-500"
    },
    {
      icon: Trophy,
      title: "Earn Rewards",
      description: "Get points for engagement and unlock exclusive perks",
      color: "text-green-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant loading, works offline, feels native",
      color: "text-blue-500"
    },
    {
      icon: TrendingUp,
      title: "Track Your Taste",
      description: "See your music discovery stats and taste evolution",
      color: "text-pink-500"
    },
    {
      icon: Users,
      title: "Join the Community",
      description: "Connect with other music fans discovering the next big thing",
      color: "text-orange-500"
    }
  ];

  const benefits = [
    "No app store needed - install directly",
    "Works on iPhone, Android, and desktop",
    "Offline access to your favorite features",
    "Push notifications for new releases",
    "Native app-like experience",
    "Always up to date automatically"
  ];

  const stats = [
    { number: "750+", label: "Artists Covered" },
    { number: "50K+", label: "Fans Reached" },
    { number: "5K+", label: "Active Discoverers" },
    { number: "100+", label: "Rewards Earned" }
  ];

  return (
    <>
      <Head>
        <title>Download OTW Live - We Reward Discovery</title>
        <meta 
          name="description" 
          content="Install OTW on your device. Discover emerging artists, rate music, and earn rewards. Works on iPhone, Android, and desktop." 
        />
        <meta property="og:title" content="Download OTW Chart App" />
        <meta property="og:description" content="Discover the next big artists before everyone else" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Hero Video - Added above headline */}
            <div className="relative w-full max-w-3xl mx-auto aspect-video overflow-hidden rounded-xl shadow-2xl mb-8">
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

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Discover Music.
              <br />
              Earn Rewards.
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Get the OTW app and be the first to discover emerging artists. 
              Rate music, earn rewards, and influence the next big thing.
            </p>

            {/* Install Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-purple-400">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={handleInstallClick}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-purple-500/50 transition-all hover:scale-105"
              >
                {mounted && deviceType === "ios" ? (
                  <>
                    <Share2 className="w-5 h-5 mr-2" />
                    Install on iPhone
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Install App
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.href = "/"}
                              className="bg-black text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-purple-500/50 transition-all hover:scale-105"
              >
                Try in Browser
              </Button>
            </div>

            {/* Device Compatibility */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>iOS</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Desktop</span>
              </div>
            </div>
          </div>
        </section>

        {/* iOS Installation Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="max-w-md w-full bg-gray-800 border-gray-600 p-6 text-white">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                <Download className="w-6 h-6 text-blue-400" />
                Install on iPhone
              </h3>
              <ol className="space-y-4 mb-6">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-white">Tap the Share button</p>
                                      <p className="text-sm text-gray-300">Look for the <Download className="w-4 h-4 inline" /> icon at the bottom of Safari</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-white">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-sm text-gray-300">It has a <span className="inline-block w-4 h-4 border border-gray-300 rounded">+</span> icon</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-white">Tap "Add" in the top right</p>
                    <p className="text-sm text-gray-300">The app will appear on your home screen</p>
                  </div>
                </li>
              </ol>
              <Button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Got it!
              </Button>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why Install OTW Live?
              </h2>
              <p className="text-xl text-gray-400">
                More than just a website - it's your music discovery companion
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-gray-900/50 border-gray-800 p-6 hover:bg-gray-900 transition-colors">
                  <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                  <h3 className="text-xl text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                App Benefits
              </h2>
              <p className="text-xl text-gray-400">
                Everything you need, nothing you don't
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 bg-gray-900/50 p-4 rounded-lg">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Discover?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of music fans discovering the next big artists
            </p>
            <Button
              size="lg"
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-6 text-xl font-semibold shadow-2xl shadow-purple-500/50 transition-all hover:scale-105"
            >
              {mounted && deviceType === "ios" ? (
                <>
                  <Share2 className="w-6 h-6 mr-2" />
                  Install Now
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-2" />
                  Install Now
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} OTW Chart. Discover music, shape culture.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
