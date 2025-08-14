
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Clock, Award } from "lucide-react";
import { videoWatchService } from "@/services/videoWatchService";
import type { VideoWatchStatus as VideoWatchStatusType } from "@/services/videoWatchService";

interface VideoWatchStatusProps {
  userId: number;
  artistUuid: string;
  weekIdentifier: string;
  currentWatchTime?: number;
  minWatchTime?: number;
  className?: string;
}

export default function VideoWatchStatus({
  userId,
  artistUuid,
  weekIdentifier,
  currentWatchTime = 0,
  minWatchTime = 15,
  className = ""
}: VideoWatchStatusProps) {
  const [watchStatus, setWatchStatus] = useState<VideoWatchStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchStatus = async () => {
      try {
        const status = await videoWatchService.getVideoWatchStatus(
          userId,
          artistUuid,
          weekIdentifier
        );
        setWatchStatus(status);
      } catch (error) {
        console.error("Error loading watch status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && artistUuid && weekIdentifier) {
      loadWatchStatus();
    }
  }, [userId, artistUuid, weekIdentifier]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!watchStatus) {
    return null;
  }

  // Use current watch time if video is actively playing, otherwise use stored time
  const displayWatchTime = currentWatchTime > 0 ? currentWatchTime : watchStatus.watchTimeSeconds;
  const hasWatched = watchStatus.hasWatched || currentWatchTime >= minWatchTime;
  const meetsMinimum = watchStatus.meetsMinRequirement || currentWatchTime >= minWatchTime;
  const earnedPoints = watchStatus.earnedPoints;

  // Calculate progress percentage
  const progressPercent = Math.min((displayWatchTime / minWatchTime) * 100, 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Watch Status Icon */}
      <div className="flex items-center gap-2">
        {meetsMinimum ? (
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            {earnedPoints && <Award className="w-4 h-4 text-yellow-500" />}
          </div>
        ) : (
          <Clock className="w-4 h-4 text-gray-400" />
        )}
        
        <span className="text-sm font-medium">
          {displayWatchTime}s / {minWatchTime}s
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 min-w-[80px] max-w-[120px]">
        <Progress 
          value={progressPercent} 
          className="h-2"
        />
      </div>

      {/* Status Badges */}
      <div className="flex gap-1">
        {meetsMinimum && (
          <Badge 
            variant="secondary" 
            className="text-xs bg-green-100 text-green-700 border-green-200"
          >
            Watched
          </Badge>
        )}
        
        {earnedPoints && (
          <Badge 
            variant="secondary"
            className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200"
          >
            +5pts
          </Badge>
        )}
        
        {hasWatched && !earnedPoints && (
          <Badge 
            variant="secondary"
            className="text-xs bg-gray-100 text-gray-600 border-gray-200"
          >
            No points
          </Badge>
        )}
      </div>
    </div>
  );
}
