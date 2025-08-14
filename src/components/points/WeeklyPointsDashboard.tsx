
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Vote, Trophy, Star, CheckCircle, Clock, Award } from "lucide-react";
import { videoWatchService } from "@/services/videoWatchService";
import { weeklyVotingService } from "@/services/weeklyVotingService";
import { pointsConfigService } from "@/services/pointsConfigService";
import type { WeeklyVideoProgress } from "@/services/videoWatchService";

interface WeeklyPointsDashboardProps {
  userId: number;
  weekIdentifier: string;
  className?: string;
}

interface WeeklyPointsSummary {
  videoPoints: number;
  votingPoints: number;
  completionBonus: number;
  totalEarned: number;
  totalPossible: number;
  hasVoted: boolean;
  canVote: boolean;
}

export default function WeeklyPointsDashboard({
  userId,
  weekIdentifier,
  className = ""
}: WeeklyPointsDashboardProps) {
  const [videoProgress, setVideoProgress] = useState<WeeklyVideoProgress | null>(null);
  const [pointsSummary, setPointsSummary] = useState<WeeklyPointsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load video progress
        const progress = await videoWatchService.getWeeklyVideoProgress(userId, weekIdentifier);
        setVideoProgress(progress);

        // Load points configuration
        const videoViewPoints = await pointsConfigService.getPoints('video_view');
        const voteSubmissionPoints = await pointsConfigService.getPoints('vote_submission');
        const completionBonusPoints = await pointsConfigService.getPoints('video_completion_bonus');

        // Check voting status
        const userVotes = await weeklyVotingService.getUserVotes(userId, weekIdentifier);
        const hasVoted = userVotes.length > 0;
        const canVote = await weeklyVotingService.isVotingOpen(weekIdentifier);

        // Calculate points earned from videos
        const videoPointsEarned = progress.videoStatuses
          .filter(status => status.earnedPoints)
          .length * videoViewPoints;

        // Calculate total possible points
        const totalVideoPoints = progress.totalVideos * videoViewPoints;
        const totalPossible = totalVideoPoints + voteSubmissionPoints + completionBonusPoints;

        const summary: WeeklyPointsSummary = {
          videoPoints: videoPointsEarned,
          votingPoints: hasVoted ? voteSubmissionPoints : 0,
          completionBonus: progress.hasEarnedCompletionBonus ? completionBonusPoints : 0,
          totalEarned: videoPointsEarned + (hasVoted ? voteSubmissionPoints : 0) + (progress.hasEarnedCompletionBonus ? completionBonusPoints : 0),
          totalPossible,
          hasVoted,
          canVote
        };

        setPointsSummary(summary);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && weekIdentifier) {
      loadDashboardData();
    }
  }, [userId, weekIdentifier]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!videoProgress || !pointsSummary) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
          <CardDescription>
            Unable to load points progress. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const completionPercent = pointsSummary.totalPossible > 0 
    ? (pointsSummary.totalEarned / pointsSummary.totalPossible) * 100 
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Weekly Points Progress
        </CardTitle>
        <CardDescription>
          {weekIdentifier} • {pointsSummary.totalEarned}/{pointsSummary.totalPossible} points earned
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Progress</span>
            <Badge variant={completionPercent === 100 ? "default" : "secondary"} className="font-mono">
              {Math.round(completionPercent)}%
            </Badge>
          </div>
          <Progress value={completionPercent} className="h-3" />
        </div>

        {/* Video Watching Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-500" />
              Video Watching
            </h4>
            <Badge variant="outline" className="text-blue-600">
              +{pointsSummary.videoPoints} pts
            </Badge>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {videoProgress.videoStatuses.map((status, index) => (
              <div
                key={status.artistUuid}
                className={`
                  relative aspect-square rounded-lg border-2 flex items-center justify-center
                  ${status.meetsMinRequirement 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                  }
                `}
              >
                {status.meetsMinRequirement ? (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    {status.earnedPoints && (
                      <Award className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                ) : (
                  <Clock className="w-6 h-6 text-gray-400" />
                )}
                
                <div className="absolute -bottom-1 -right-1 text-xs font-mono bg-white border rounded px-1">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            {videoProgress.watchedVideos}/{videoProgress.totalVideos} videos watched
            {videoProgress.watchedVideos === videoProgress.totalVideos && !videoProgress.hasEarnedCompletionBonus && (
              <span className="text-yellow-600 font-medium"> - Completion bonus ready!</span>
            )}
          </div>
        </div>

        {/* Completion Bonus */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Completion Bonus
            </h4>
            <Badge 
              variant={videoProgress.hasEarnedCompletionBonus ? "default" : "outline"}
              className={videoProgress.hasEarnedCompletionBonus ? "text-yellow-800 bg-yellow-100" : "text-gray-600"}
            >
              {videoProgress.hasEarnedCompletionBonus ? '+15 pts' : '15 pts available'}
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600">
            {videoProgress.hasEarnedCompletionBonus 
              ? "Bonus earned! You watched all videos this week."
              : `Watch ${videoProgress.totalVideos - videoProgress.watchedVideos} more videos to earn bonus`
            }
          </div>
        </div>

        {/* Voting Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Vote className="w-4 h-4 text-green-500" />
              Weekly Voting
            </h4>
            <Badge 
              variant={pointsSummary.hasVoted ? "default" : pointsSummary.canVote ? "outline" : "secondary"}
              className={
                pointsSummary.hasVoted 
                  ? "text-green-800 bg-green-100" 
                  : pointsSummary.canVote 
                    ? "text-green-600" 
                    : "text-gray-600"
              }
            >
              {pointsSummary.hasVoted 
                ? '+10 pts' 
                : pointsSummary.canVote 
                  ? '10 pts available' 
                  : 'Voting closed'
              }
            </Badge>
          </div>
          
          <div className="text-sm text-gray-600">
            {pointsSummary.hasVoted 
              ? "Thanks for voting this week!"
              : pointsSummary.canVote 
                ? "Submit your votes to earn 10 points"
                : "Voting window has ended for this week"
            }
          </div>
        </div>

        {/* Quick Actions */}
        {(!pointsSummary.hasVoted && pointsSummary.canVote) && (
          <div className="pt-4 border-t">
            <Button className="w-full" size="sm">
              <Vote className="w-4 h-4 mr-2" />
              Submit Your Votes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
