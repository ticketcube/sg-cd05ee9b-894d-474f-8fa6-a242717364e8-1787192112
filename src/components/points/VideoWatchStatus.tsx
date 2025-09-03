
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useUser } from "@supabase/auth-helpers-react";
import { videoWatchService } from "@/services/videoWatchService";

interface VideoWatchStatusProps {
  artistUuid: string;
  weekIdentifier: string;
  className?: string;
}

interface WatchStatusData {
  hasWatched: boolean;
  watchedAt?: string;
}

export default function VideoWatchStatus({
  artistUuid,
  weekIdentifier,
  className = "",
}: VideoWatchStatusProps) {
  const user = useUser();
  const [watchStatus, setWatchStatus] = useState<WatchStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWatchStatus();
    }
  }, [user, artistUuid, weekIdentifier]);

  const loadWatchStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const watchData = await videoWatchService.getWatchStatus(user.id, artistUuid, weekIdentifier);
      
      setWatchStatus({
        hasWatched: watchData.length > 0,
        watchedAt: watchData[0]?.created_at
      });
    } catch (error) {
      console.error("Error loading video watch status:", error);
      setWatchStatus({ hasWatched: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (!watchStatus) {
    return null;
  }

  return (
    <Badge
      variant={watchStatus.hasWatched ? "default" : "outline"}
      className={`gap-1 ${className}`}
    >
      {watchStatus.hasWatched ? (
        <>
          <Eye className="w-3 h-3" />
          Watched
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3" />
          Not Watched
        </>
      )}
    </Badge>
  );
}