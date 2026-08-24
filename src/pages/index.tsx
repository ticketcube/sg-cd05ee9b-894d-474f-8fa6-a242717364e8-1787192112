import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Users, Sparkles } from "lucide-react";
import Image from "next/image";

// Force rebuild to clear HMR cache
export default function HomePage() {
  const router = useRouter();

  const handleArtistsClick = () => {
    alert("Coming soon! Artist features are currently in development.");
  };

  return (
    <>
      <Head>
        <title>OnesToWatch - On Tour</title>
        <meta
          name="description"
          content="Discover emerging artists, earn rewards, and shape the future of music."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 py-20">

             
                      <div className="fixed inset-0 w-full h-full">
                          <iframe
                              src="https://ticketcube.org/events"
                              className="w-full h-full border-0"
                              title="StubHub Arts"
                              allowFullScreen
                              allow="autoplay; fullscreen; picture-in-picture"
                          />
                      </div>
                
}
          
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