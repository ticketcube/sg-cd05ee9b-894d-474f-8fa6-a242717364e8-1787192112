import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Trophy } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function UserProfileCard() {
  const { profile, user } = useUserProfile();

  if (!profile || !user) {
    return (
      <Card className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/60 shadow-lg shadow-neutral-900/5">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse text-neutral-500">Loading profile...</div>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <Card className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200/60 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-500 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-neutral-800">
          <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white shadow-lg">
            <AvatarFallback className="text-white font-bold text-lg bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-neutral-200/40 hover:bg-white/80 transition-colors duration-300">
            <User className="h-4 w-4 text-neutral-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700">Username</p>
              <p className="text-neutral-900 font-semibold">{profile.username || "Not set"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-neutral-200/40 hover:bg-white/80 transition-colors duration-300">
            <Mail className="h-4 w-4 text-neutral-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700">Email</p>
              <p className="text-neutral-900 font-semibold truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 hover:from-amber-100 hover:to-yellow-100 transition-all duration-300">
            <Trophy className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">Total Points</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-amber-900">{profile.total_points || 0}</p>
                <Badge variant="secondary" className="bg-amber-200/50 text-amber-800 border-amber-300/60">
                  Points
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}