
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, Trophy, Zap } from "lucide-react";

export interface PointsNotificationData {
  points: number;
  message: string;
  type: 'video_view' | 'vote_submission' | 'video_completion_bonus' | 'weekly_streak' | 'referral_bonus';
  artistName?: string;
  show: boolean;
}

interface PointsNotificationProps {
  notification: PointsNotificationData;
  onClose: () => void;
  duration?: number;
}

export default function PointsNotification({ 
  notification, 
  onClose, 
  duration = 3000 
}: PointsNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification.show) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow exit animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification.show, duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'video_view':
        return <Star className="w-5 h-5" />;
      case 'vote_submission':
        return <Award className="w-5 h-5" />;
      case 'video_completion_bonus':
        return <Trophy className="w-5 h-5" />;
      case 'weekly_streak':
        return <Zap className="w-5 h-5" />;
      case 'referral_bonus':
        return <Award className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'video_view':
        return 'bg-blue-500';
      case 'vote_submission':
        return 'bg-green-500';
      case 'video_completion_bonus':
        return 'bg-yellow-500';
      case 'weekly_streak':
        return 'bg-purple-500';
      case 'referral_bonus':
        return 'bg-pink-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed top-20 right-4 z-50 pointer-events-auto"
        >
          <div className={`${getBgColor()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px]`}>
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  +{notification.points} points!
                </span>
              </div>
              
              <div className="text-sm opacity-90 mt-1">
                {notification.message}
                {notification.artistName && (
                  <span className="font-medium"> • {notification.artistName}</span>
                )}
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex-shrink-0 text-2xl"
            >
              ✨
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing points notifications
export function usePointsNotifications() {
  const [notification, setNotification] = useState<PointsNotificationData>({
    points: 0,
    message: '',
    type: 'video_view',
    show: false
  });

  const showNotification = (data: Omit<PointsNotificationData, 'show'>) => {
    setNotification({ ...data, show: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const showVideoViewNotification = (points: number, artistName?: string) => {
    showNotification({
      points,
      message: "Great! You watched the video",
      type: 'video_view',
      artistName
    });
  };

  const showVoteSubmissionNotification = (points: number) => {
    showNotification({
      points,
      message: "Thanks for voting this week!",
      type: 'vote_submission'
    });
  };

  const showCompletionBonusNotification = (points: number) => {
    showNotification({
      points,
      message: "Bonus! You watched all videos this week",
      type: 'video_completion_bonus'
    });
  };

  const showStreakBonusNotification = (points: number, streakCount: number) => {
    showNotification({
      points,
      message: `${streakCount} week voting streak!`,
      type: 'weekly_streak'
    });
  };

  const showReferralBonusNotification = (points: number) => {
    showNotification({
      points,
      message: "Your friend joined! Thanks for referring",
      type: 'referral_bonus'
    });
  };

  return {
    notification,
    showNotification,
    hideNotification,
    showVideoViewNotification,
    showVoteSubmissionNotification,
    showCompletionBonusNotification,
    showStreakBonusNotification,
    showReferralBonusNotification
  };
}
