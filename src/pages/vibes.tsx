import { GetStaticProps } from "next";
import Head from "next/head";
import { VibeArtist } from "@/types/artists";
import { artistService } from "@/services/artistService";
import VibeChart from "@/components/VibeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VibesPageProps {
  artists: VibeArtist[];
}

export default function VibesPage({ artists }: VibesPageProps) {
  return (
    <>
      <Head>
        <title>Vibes Chart - OTW</title>
        <meta name="description" content="Explore the vibes of the top artists." />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Vibes Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-400 mb-6">
              Discover where the top 100 artists land on the vibe spectrum.
            </p>
            <VibeChart artists={artists} chartSize={800} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Get all 100 artists without pagination by setting a high limit
  const result = await artistService.getTop100ArtistsSortedByVotes(1, 100);

  return {
    props: {
      artists: JSON.parse(JSON.stringify(result.artists)),
    },
    revalidate: 60,
  };
};
