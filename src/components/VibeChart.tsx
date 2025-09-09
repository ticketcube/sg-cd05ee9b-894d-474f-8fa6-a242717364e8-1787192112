import { useState, useEffect } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from "recharts";
import { artistService } from "@/services/artistService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { VibeArtist } from "@/types/artists";

interface VibeData {
  vibe: string;
  count: number;
}

const VibeChart = () => {
  const [vibeData, setVibeData] = useState<VibeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVibeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const vibeCounts = await artistService.getVibeCounts();
        
        const formattedData: VibeData[] = Object.entries(vibeCounts)
          .map(([vibe, count]) => ({
            vibe,
            count,
          }))
          .sort((a, b) => b.count - a.count); // Sort to get a consistent shape

        setVibeData(formattedData);
      } catch (err) {
        console.error("Failed to fetch vibe data:", err);
        setError("Could not load vibe data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVibeData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vibe Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            Loading vibe data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vibe Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vibe Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={vibeData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="vibe" />
            <PolarRadiusAxis />
            <Radar
              name="Artists"
              dataKey="count"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VibeChart;
