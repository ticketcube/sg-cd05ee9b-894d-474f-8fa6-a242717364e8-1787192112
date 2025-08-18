import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Trophy, Calendar, Star,
  TrendingUp, Award, Eye, Vote, BarChart, Settings, RefreshCw
} from "lucide-react";
import userProfileService from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";

interface UserStats {
  total_votes: number;
  weekly_participations: number;
  top_genre: string | null;
}

// ✅ Move SeptemberReward outside ProfilePage
function SeptemberReward({ totalPoints }: { totalPoints: number }) {
  const goal = 180;
  const isComplete = totalPoints >= goal;

  return (
    <div
      className={`rounded-lg p-4 transition-all ${isComplete
        ? "bg-green-800 border border-green-600"
        : "bg-gray-800"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-center font-bold transition-all ${isComplete
            ? "bg-yellow-500 text-white"
            : "bg-gray-700 text-gray-300"
            }`}
        >
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-semibold text-white">September Zine Package</h3>
          {!isComplete ? (
            <p className="text-sm text-gray-400">
              Earn {goal} points this month to win all 9 zines!
            </p>
          ) : (
            <p className="text-sm text-green-300 font-semibold">
              🎉 Completed! Package on the way.
            </p>
          )}

          {!isComplete && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-2 transition-all"
                style={{ width: `${Math.min((totalPoints / goal) * 100, 100)}%` }}
              />
            </div>
          )}

          <p
            className={`mt-1 text-xs ${isComplete
              ? "text-green-400 font-bold"
              : "text-gray-400"
              }`}
          >
            {totalPoints} / {goal} points
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [userHistory, setUserHistory] = useState < UserEngagementHistory | null > (null);
  const [error, setError] = useState < string | null > (null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserHistory = async () => {
    if (!u
