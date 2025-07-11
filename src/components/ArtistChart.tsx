import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { Artist } from "@/services/artistService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TikTokEmbed } from "@/components/TikTokEmbed";

interface ArtistChartProps {
  artists: Artist[];
  onVote: (artist: Artist) => void;
  selectedArtists: number[];
}

export function ArtistChart({ artists, onVote, selectedArtists }: ArtistChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const newChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          data: artists.map(artist => ({
            x: artist.artist_totallisteners || 0,
            y: artist.artist_totalwatchers || 0,
            artist: artist
          })),
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          pointRadius: 6,
          pointHoverRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const element = elements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            const rawData = newChart.data.datasets[datasetIndex].data[index] as { artist: Artist };
            const artist = rawData?.artist;
            if (artist) {
              setSelectedArtist(artist);
            }
          }
        },
        plugins: {
          tooltip: {
            enabled: false
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Total Listeners",
              color: "white"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              display: false
            }
          },
          y: {
            title: {
              display: true,
              text: "Total Watchers",
              color: "white"
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)"
            },
            ticks: {
              display: false
            }
          }
        }
      }
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [artists]);

  return (
    <div className="w-full h-[calc(100vh-280px)] bg-black p-4 rounded-lg relative"
      style={{
        backgroundImage: "url(/OTWLogocolor.png)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
      }}
    >
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          zIndex: 1
        }}
      />
      <canvas 
        ref={chartRef} 
        className="relative z-10"
      />
      
      <Dialog open={!!selectedArtist} onOpenChange={() => setSelectedArtist(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedArtist?.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>OnesToWatch Class of: {new Date(selectedArtist?.artist_otwcreateddate || "").getFullYear()}</p>
            <div className="flex flex-col gap-4">
              {selectedArtist?.artist_tiktok_username && selectedArtist?.artist_tiktok_videoid && (
                <div className="w-full flex justify-center">
                  <TikTokEmbed 
                    username={selectedArtist.artist_tiktok_username}
                    videoId={selectedArtist.artist_tiktok_videoid}
                  />
                </div>
              )}
              <div className="flex gap-2">
                {selectedArtist?.artist_audiolink && (
                  <a
                    href={selectedArtist.artist_audiolink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    LISTEN
                  </a>
                )}
                <button
                  onClick={() => selectedArtist && onVote(selectedArtist)}
                  className={cn(
                    "text-white px-4 py-2 rounded",
                    selectedArtists.includes(selectedArtist?.artist_otwid || 0) 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {selectedArtists.includes(selectedArtist?.artist_otwid || 0) ? "VOTED" : "TOP 25 VOTE"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
