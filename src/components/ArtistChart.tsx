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
import ArtistVideoPlayer from "@/components/ArtistVideoPlayer";

interface ArtistChartProps {
  artists: Artist[];
  onVote: (artist: Artist) => void;
  selectedArtists: string[];
}

export function ArtistChart({ artists, onVote, selectedArtists }: ArtistChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const videoTimeoutRef = useRef<NodeJS.Timeout>();

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
              text: " ",
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
              text: " ",
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

  const handleShowVideo = () => {
    setShowVideo(true);
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
    }
    videoTimeoutRef.current = setTimeout(() => {
      setShowVideo(false);
    }, 15000);
  };

  useEffect(() => {
    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, []);

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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedArtist?.artist_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>OnesToWatch Class of: {new Date(selectedArtist?.artist_otwcreateddate || "").getFullYear()}</p>
            <div className="flex flex-col gap-4">
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
                {(selectedArtist?.artist_videolink || (selectedArtist?.artist_tiktok_username && selectedArtist?.artist_tiktok_videoid)) && (
                  <button
                    onClick={handleShowVideo}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    WATCH
                  </button>
                )}
                <button
                  onClick={() => selectedArtist && onVote(selectedArtist)}
                  className={cn(
                    "text-white px-4 py-2 rounded",
                    selectedArtists.includes(selectedArtist?.UUID || '') 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {selectedArtists.includes(selectedArtist?.UUID || '') ? "VOTED" : "TOP 25 VOTE"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 z-10 text-white hover:bg-white hover:bg-opacity-20 bg-black bg-opacity-50 rounded-full p-2"
            >
              ✕
            </button>

            {/* Video Content */}
            {selectedArtist && (
              <div className="aspect-video w-full">
                <ArtistVideoPlayer 
                  artist={selectedArtist}
                  showPlayButton={false}
                  className="w-full h-full rounded-none"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
