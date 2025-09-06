import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SpectixPage() {
  return (
    <>
      <Head>
        <title>Spectix - The Future of Event Tickets</title>
        <meta name="description" content="Discover Spectix, the revolutionary NFT ticketing platform integrated with OTWChart." />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Spectix</h1>
        </header>
      </div>
    </>
  );
}