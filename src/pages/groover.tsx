
import GrooverMap from "@/components/GrooverMap";
import { Sidebar } from "@/components/ui/sidebar";
import Head from "next/head";

export default function GrooverPage() {
  return (
    <>
      <Head>
        <title>Groover Artists Map | OTW</title>
        <meta name="description" content="Discover Groover artists from around the world on an interactive map." />
      </Head>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <GrooverMap />
        </main>
      </div>
    </>
  );
}
