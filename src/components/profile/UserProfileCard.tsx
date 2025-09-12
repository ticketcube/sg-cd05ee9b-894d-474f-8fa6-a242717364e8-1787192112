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
        <CardContent className="flex items-center justify-center p-3">
          <div className="animate-pulse text-neutral-400 text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base md:text-lg font-semibold text-white">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 border border-neutral-600 shadow-md">
            <AvatarFallback className="text-white font-bold text-base bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span>Profile</span>
              <Badge className="bg-gradient-to-r from-amber-800/60 to-yellow-800/60 text-amber-200 border-amber-700/50 text-sm font-bold">
                {profile.total_points || 0} pts
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-neutral-400 flex-shrink-0" />
            <span className="text-neutral-500 text-xs">Username:</span>
            <span className="text-white font-medium truncate">{profile.username || "Not set"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-neutral-400 flex-shrink-0" />
            <span className="text-neutral-500 text-xs">Email:</span>
            <span className="text-white font-medium truncate">{user.email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}