
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
            
            <Link href="/ticketcube" className="text-white hover:text-gray-300 transition-colors">
              <div className="text-lg font-semibold">TC</div>
            </Link>
          </div>
          
          <GrooverMap />
        </div>
          </div>

         
    </>
  );
}
