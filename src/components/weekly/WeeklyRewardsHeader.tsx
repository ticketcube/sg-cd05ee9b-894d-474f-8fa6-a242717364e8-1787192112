// src/components/weekly/WeeklyRewardsHeader.tsx
import HowPointsWorkModal from "@/components/points/HowPointsWorkModal";

export default function WeeklyRewardsHeader() {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">Weekly Artist Ratings</h1>
      <HowPointsWorkModal />
    </div>
  );
}