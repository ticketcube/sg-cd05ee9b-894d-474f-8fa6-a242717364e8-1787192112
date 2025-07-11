
import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { useRouter } from "next/router";

interface GenreData {
  genre: string;
  count: number;
}

interface GenreDoughnutChartProps {
  genreData: GenreData[];
}

export function GenreDoughnutChart({ genreData }: GenreDoughnutChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!chartRef.current || !genreData.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Generate colors for each genre
    const colors = [
      "rgba(59, 130, 246, 0.8)",   // Blue
      "rgba(239, 68, 68, 0.8)",    // Red
      "rgba(34, 197, 94, 0.8)",    // Green
      "rgba(234, 179, 8, 0.8)",    // Yellow
      "rgba(168, 85, 247, 0.8)",   // Purple
      "rgba(236, 72, 153, 0.8)",   // Pink
      "rgba(20, 184, 166, 0.8)",   // Teal
      "rgba(249, 115, 22, 0.8)",   // Orange
      "rgba(156, 163, 175, 0.8)",  // Gray
      "rgba(99, 102, 241, 0.8)",   // Indigo
    ];

    const backgroundColors = genreData.map((_, index) => colors[index % colors.length]);
    const borderColors = backgroundColors.map(color => color.replace("0.8", "1"));

    const newChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: genreData.map(item => item.genre),
        datasets: [{
          data: genreData.map(item => item.count),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white',
              font: {
                size: 14
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return context.label || '';
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const selectedGenre = genreData[elementIndex].genre;
            
            // Navigate to home page with genre filter
            router.push(`/?genres=${encodeURIComponent(selectedGenre)}`);
          }
        }
      }
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [genreData, router]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-black p-6 rounded-lg" style={{ height: "500px" }}>
      <canvas ref={chartRef} />
    </div>
  );
}
