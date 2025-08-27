
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Eye, Star, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { weeklyListService } from "@/services/weeklyListService";
import { videoWatchService } from "@/services/videoWatchService";
import weeklyVotingService from "@/services/weeklyVotingService";
import userProfileService from "@/services/userProfileService";

interface WeeklyProgressData {
  weekIdentifier: string;
  totalArtists: number;
  videosWatched: number;
  artistsRated: number;
  pointsEarned: number;
  completionBonus: number;
  isComplete: boolean;
}

interface WeeklyPointsDashboardProps {
  weekIdentifier?: string;
  className?: string;
}

export default function WeeklyPointsDashboard({
  weekIdentifier,
  className = "",
}: WeeklyPointsDashboardProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WeeklyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklyProgress = useCallback(async () => {
    if (!user || !weekIdentifier) return;

    try {
      setLoading(true);
      setError(null);

      // Get the weekly list and its artists
      const weeklyList = await weeklyListService.getWeeklyListForUser(weekIdentifier, user.auth_id); // ✅ ALREADY CORRECT: Uses user.auth_id (string)
      if (!weeklyList) {
        throw new Error("Weekly list not found");
      }

      const artistUuids = weeklyList.artists.map(a => a.artist.uuid);
      const totalArtists = artistUuids.length;

      // Check videos watched
      let videosWatched = 0;
      for (const artistUuid of artistUuids) {
        try {
          const watchData = await videoWatchService.getWatchStatus(user.auth_id, artistUuid, weekIdentifier); // ✅ ALREADY CORRECT: Uses user.auth_id (string)
          if (watchData.length > 0) {
            videosWatched++;
          }
        } catch (error) {
          console.error("Error checking watch status for artist:", artistUuid, error);
        }
      }

      // Get user votes for this week
      const userVotes = await weeklyVotingService.getUserVotes(user.auth_id, weekIdentifier); // ✅ ALREADY CORRECT: Uses user.auth_id (string)
      const artistsRated = userVotes.length;

      // Get total points earned this week - ✅ FIXED: Use auth_id directly
      const weeklyStats = await userProfileService.getWeeklyStats(user.auth_id, weekIdentifier);
      const pointsEarned = weeklyStats.total_points || 0;

      // Calculate completion bonus (assuming it's awarded when all artists are rated)
      const completionBonus = artistsRated === totalArtists ? 50 : 0; // This should match your points config
      const isComplete = artistsRated === totalArtists && videosWatched === totalArtists;

      setProgress({
        weekIdentifier,
        totalArtists,
        videosWatched,
        artistsRated,
        pointsEarned,
        completionBonus,
        isComplete,
      });
    } catch (err) {
      console.error("Error loading weekly progress:", err);
      setError(err instanceof Error ? err.message : "Failed to load weekly progress");
    } finally {
      setLoading(false);
    }
  }, [user, weekIdentifier]);

  useEffect(() => {
    if (user && weekIdentifier) {
      loadWeeklyProgress();
    }
  }, [user, weekIdentifier, loadWeeklyProgress]);

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading weekly progress...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progress) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <p className="text-red-500 text-center">
            {error || "Unable to load weekly progress"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const videoProgress = (progress.videosWatched / progress.totalArtists) * 100;
  const ratingProgress = (progress.artistsRated / progress.totalArtists) * 100;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Videos Watched */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Videos Watched</span>
            </div>
            <Badge variant="outline">
              {progress.videosWatched}/{progress.totalArtists}
            </Badge>
          </div>
          <Progress value={videoProgress} className="h-2" />
        </div>

        {/* Artists Rated */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="text-sm">Artists Rated</span>
            </div>
            <Badge variant="outline">
              {progress.artistsRated}/{progress.totalArtists}
            </Badge>
          </div>
          <Progress value={ratingProgress} className="h-2" />
        </div>

        {/* Points Summary */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Points Earned</span>
            </div>
            <Badge className="bg-green-600">
              +{progress.pointsEarned} pts
            </Badge>
          </div>
          
          {progress.isComplete && progress.completionBonus > 0 && (
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-purple-400">Completion Bonus</span>
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                +{progress.completionBonus} pts
              </Badge>
            </div>
          )}
        </div>

        {progress.isComplete && (
          <Badge className="w-full justify-center bg-green-600">
            Week Complete! 🎉
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}