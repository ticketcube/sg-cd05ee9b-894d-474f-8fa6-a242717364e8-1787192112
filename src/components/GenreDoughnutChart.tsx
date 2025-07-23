
import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

interface GenreData {
  genre: string;
  count: number;
}

interface GenreDoughnutChartProps {
  genreData: GenreData[];
  onGenreClick: (genre: string) => void;
}

export function GenreDoughnutChart({ genreData, onGenreClick }: GenreDoughnutChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

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
      "rgba(245, 101, 101, 0.8)",  // Light Red
      "rgba(72, 187, 120, 0.8)",   // Light Green
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
          hoverOffset: 8
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
                size: 12
              },
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            titleFont: {
              size: 16,
              weight: 'bold'
            },
            bodyFont: {
              size: 14
            },
            padding: 12,
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label;
              },
              label: (context) => {
                return `# of Artists Covered: ${context.parsed}`;
              },
              afterLabel: () => {
                return 'Click to view artists';
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const selectedGenre = genreData[elementIndex].genre;
            onGenreClick(selectedGenre);
          }
        },
        onHover: (event, chartElement) => {
          const target = event.native?.target as HTMLElement;
          if (target) {
            target.style.cursor = chartElement[0] ? 'pointer' : 'default';
          }
        }
      }
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [genreData, onGenreClick]);

  return (
    <div className="w-full bg-gray-900 p-6 rounded-lg" style={{ height: "500px" }}>
      <canvas ref={chartRef} />
    </div>
  );
}
