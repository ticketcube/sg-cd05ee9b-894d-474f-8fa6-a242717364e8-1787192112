import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

interface VoteData {
  artist_name: string;
  vote_count: number;
}

interface VoteRankingChartProps {
  voteData: VoteData[];
}

export function VoteRankingChart({ voteData }: VoteRankingChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !voteData.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data by vote count (descending)
    const sortedData = [...voteData].sort((a, b) => b.vote_count - a.vote_count);

    // Determine colors based on vote count
    const colors = sortedData.map(item => {
      if (item.vote_count === 0) return "rgba(128, 128, 128, 0.8)"; // Gray for 0 votes
      if (item.vote_count <= 50) return "rgba(59, 130, 246, 0.8)"; // Blue for 1-50
      if (item.vote_count <= 100) return "rgba(234, 179, 8, 0.8)"; // Yellow for 51-100
      return "rgba(239, 68, 68, 0.8)"; // Red for 100+
    });

    const newChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedData.map(item => item.artist_name),
        datasets: [{
          data: sortedData.map(item => item.vote_count),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace("0.8", "1")),
          borderWidth: 1,
          barThickness: 25
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Votes: ${context.parsed.x}`
            }
          }
        },
        scales: {
          x: {
            display: false, // Hide the x-axis
            grid: {
              display: false // Hide x-axis grid lines
            }
          },
          y: {
            grid: {
              display: false // Hide y-axis grid lines
            },
            ticks: {
              color: "white",
              font: {
                size: 16, // Increased font size
                weight: 'bold' // Make text bold
              },
              padding: 20 // Add more padding between text and bars
            }
          }
        }
      }
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [voteData]);

  return (
    <div className="w-full bg-black p-4 rounded-lg" style={{ height: `${Math.max(600, voteData.length * 40)}px` }}>
      <canvas ref={chartRef} />
    </div>
  );
}
