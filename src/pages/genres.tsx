
import { useEffect, useState } from "react";
import { artistService } from "@/services/artistService";
import { GenreDoughnutChart } from "@/components/GenreDoughnutChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GenreData {
  genre: string;
  count: number;
}

export default function GenresPage() {
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const genreCounts = await artistService.getGenreCounts();
        setGenreData(genreCounts);
      } catch (error) {
        console.error("Error loading genre data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading genre data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-500">Artist Genres</h1>
      <div className="flex justify-center mb-6">
        <Link href="/">
          <Button className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-3">
            VOTE FOR YOUR TOP 25!
          </Button>
        </Link>
      </div>
      <div className="flex justify-center">
        <GenreDoughnutChart genreData={genreData} />
      </div>
      <div className="text-center mt-6 text-gray-400">
        <p>Click on any genre to filter artists on the home page</p>
      </div>
    </div>
  );
}
