import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Trophy, Calendar, Star, TrendingUp, Award, Eye, Vote, Users, BarChart, Settings } from "lucide-react";
import { userProfileService } from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";

interface UserStats {
  total_votes: number;
  weekly_participations: number;
  top_genre: string | null;
}

const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{value}</p>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user } = useAuth();
  const [userHistory, setUserHistory] = useState<UserEngagementHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile(user.id);
    } else {
      // Handle case where user is not authenticated, though AuthGuard should prevent this.
      setLoading(false);
      setError("User not found. Please log in.");
    }
  }, [user]);

  const loadUserProfile = async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await userProfileService.getUserEngagementHistory(userId);
      setUserHistory(history);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
      console.error("Error loading profile:", errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWeekDisplayName = (weekIdentifier: string) => {
    if (weekIdentifier.includes('W')) {
      const [year, week] = weekIdentifier.split('-W');
      return `Week ${week}, ${year}`;
    }
    return weekIdentifier;
  };

  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1;
  };

  const calculateProgressToNextLevel = (points: number) => {
    const currentLevelPoints = (calculateLevel(points) - 1) * 100;
    const nextLevelPoints = calculateLevel(points) * 100;
    const progress = points - currentLevelPoints;
    const total = nextLevelPoints - currentLevelPoints;
    return { progress, total, percentage: (progress / total) * 100 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Profile...</h1>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !userHistory) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
          <p className="text-xl text-red-500">{error || "Profile not found"}</p>
          <Button onClick={() => window.location.href = "/"} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { user_profile, weekly_summaries, total_points } = userHistory;
  const level = calculateLevel(total_points);
  const levelProgress = calculateProgressToNextLevel(total_points);

  const userStats: UserStats = {
    total_votes: weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0),
    weekly_participations: weekly_summaries.length,
    top_genre: "Electronic", // Mock data since top_genre doesn't exist in the API
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/"}
                className="text-white hover:bg-gray-800 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-blue-500">
                User Profile
              </h1>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{user_profile.username}</h2>
                  <p className="text-gray-400">{user_profile.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {formatDate(user_profile.created_at)}
                  </p>
                </div>
              </div>

              {/* Level and Points */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">Level {level}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-500">
                    {total_points} pts
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${levelProgress.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {levelProgress.progress} / {levelProgress.total} points to Level {level + 1}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-500">
                    {weekly_summaries.reduce((sum, week) => sum + week.votes_submitted, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-500">
                    {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Videos Watched</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-500">
                    {weekly_summaries.length}
                  </div>
                  <div className="text-xs text-gray-400">Weeks Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="activity" className="text-white data-[state=active]:bg-blue-600">
                Weekly Activity
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-blue-600">
                Achievements
              </TabsTrigger>
            </TabsList>

            {/* Weekly Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5" />
                    Weekly Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weekly_summaries.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No activity yet. Start voting to see your history!</p>
                    </div>
                  ) : (
                    weekly_summaries.map((week) => (
                      <div key={week.week_identifier} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">
                            {getWeekDisplayName(week.week_identifier)}
                          </h3>
                          <Badge variant="secondary" className="bg-blue-600 text-white">
                            +{week.total_points} pts
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Vote className="w-4 h-4 text-green-500" />
                            <span>{week.votes_submitted} votes submitted</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Eye className="w-4 h-4 text-purple-500" />
                            <span>{week.video_views} videos watched</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5" />
                    Achievements & Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Level Achievement */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Level {level} Achiever</h3>
                        <p className="text-sm text-gray-400">
                          Reached level {level} with {total_points} total points
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Voting Streak */}
                  {weekly_summaries.length >= 3 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Consistent Voter</h3>
                          <p className="text-sm text-gray-400">
                            Active for {weekly_summaries.length} weeks
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Watcher */}
                  {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0) >= 10 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Music Explorer</h3>
                          <p className="text-sm text-gray-400">
                            Watched {weekly_summaries.reduce((sum, week) => sum + week.video_views, 0)} artist videos
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coming Soon */}
                  <div className="bg-gray-800 rounded-lg p-4 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <Award className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-400">More achievements coming soon...</h3>
                        <p className="text-sm text-gray-500">
                          Keep voting and exploring to unlock new badges!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = "/weekly"}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continue Voting
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="flex-1"
            >
              Explore Artists
            </Button>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Users className="w-6 h-6 text-white" />} title="Total Votes" value={userStats.total_votes} />
            <StatCard icon={<BarChart className="w-6 h-6 text-white" />} title="Weekly Participations" value={userStats.weekly_participations} />
            <StatCard icon={<Settings className="w-6 h-6 text-white" />} title="Top Genre" value={userStats.top_genre || "N/A"} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
