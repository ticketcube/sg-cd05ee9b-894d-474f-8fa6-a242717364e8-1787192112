
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Trophy } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function UserProfileCard() {
  const { profile, user } = useUserProfile();

  if (!profile || !user) {
    return (
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20">
        <CardContent className="flex items-center justify-center p-4">
          <div className="animate-pulse text-neutral-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-500 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 border border-neutral-600 shadow-lg">
            <AvatarFallback className="text-white font-bold text-sm bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/60 border border-neutral-700/50 hover:bg-neutral-800/80 transition-colors duration-300">
            <User className="h-3 w-3 text-neutral-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500">Username</p>
              <p className="text-white font-medium text-sm truncate">{profile.username || "Not set"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/60 border border-neutral-700/50 hover:bg-neutral-800/80 transition-colors duration-300">
            <Mail className="h-3 w-3 text-neutral-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500">Email</p>
              <p className="text-white font-medium text-sm truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-700/50 hover:from-amber-900/60 hover:to-yellow-900/60 transition-all duration-300">
            <Trophy className="h-4 w-4 text-amber-400" />
            <div className="flex-1">
              <p className="text-xs text-amber-300">Points</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-amber-200">{profile.total_points || 0}</p>
                <Badge variant="secondary" className="bg-amber-800/50 text-amber-200 border-amber-700/50 text-xs">
                  Total
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
