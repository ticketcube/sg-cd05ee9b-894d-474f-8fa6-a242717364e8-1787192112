import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { artistService } from "@/services/artistService";
import { GenreDoughnutChart } from "@/components/GenreDoughnutChart";

interface GenreData {
  name: string;
  count: number;
}

export default function GenresPage() {
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArtists, setTotalArtists] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchGenres = async () => {
      const counts = await artistService.getGenreCounts();
      const genreData: GenreData[] = Object.entries(counts).map(
        ([name, count]) => ({
          name,
          count: Number(count),
        })
      );
      setGenreData(genreData);
      
      // Calculate total artists
      const total = genreData.reduce((sum, item) => sum + item.count, 0);
      setTotalArtists(total);
    };
    fetchGenres();
  }, []);

  const handleGenreClick = (genre: string) => {
    router.push(`/genres/${encodeURIComponent(genre)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading genre data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-500">10 Years of Discovery</h1>
        <p className="text-center mb-8 text-lg text-gray-300">Total Artists Covered: {totalArtists}</p>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <GenreDoughnutChart genreData={genreData} onGenreClick={handleGenreClick} />
          </div>
          
          <div className="w-full lg:w-1/3">
            <h2 className="text-2xl font-bold mb-4 text-center lg:text-left">Genre Breakdown</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {genreData.map((item) => (
                <div 
                  key={item.name}
                  onClick={() => handleGenreClick(item.name)}
                  className="flex justify-between items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
