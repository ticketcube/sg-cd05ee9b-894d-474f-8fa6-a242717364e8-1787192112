
import GrooverMap from "@/components/GrooverMap";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";

export default function GrooverPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Groover Artists Map | OTW</title>
        <meta name="description" content="Discover Groover artists from around the world on an interactive map." />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-white hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              <div className="text-lg font-semibold">OTW Chart</div>
            </Link>
          </div>
          
          <GrooverMap />
        </div>
          </div>

          {/* Groover Chart */}
          <Card className="bg-gradient-to-br from-green-500 to-teal-600 border-0 hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                  
                  <Button
                      onClick={() => handleNavigation("/genres")}
                      className="w-full bg-white text-teal-600 hover:bg-gray-100 font-bold py-3"
                  >
                      Browse Genres
                  </Button>
              </CardContent>
          </Card>
    </>
  );
}
