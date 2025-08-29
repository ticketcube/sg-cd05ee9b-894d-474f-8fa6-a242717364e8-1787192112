
import { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const HomePage: NextPage = () => {
  return (
    <AppLayout>
      <Head>
        <title>OTW Chart - The Future of Music Discovery</title>
        <meta name="description" content="Discover, rate, and influence the next big artists on OTW Chart." />
      </Head>
      <main className="flex-grow flex items-center">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center py-20 md:py-32">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
                Discover What&apos;s Next
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              OTW Chart is your platform to unearth emerging artists, shape the music landscape, and get rewarded for your taste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/discovery-charts">Explore the Charts</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/top100">See the Top 100</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default HomePage;
