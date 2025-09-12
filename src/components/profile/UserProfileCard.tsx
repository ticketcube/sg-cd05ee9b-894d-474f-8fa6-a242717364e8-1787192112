import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Trophy } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function UserProfileCard() {
  const { profile, user } = useUserProfile();

  if (!profile || !user) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-4 text-lg font-medium text-black">
          <Avatar className="h-12 w-12 bg-gray-100 border border-gray-200">
            <AvatarFallback className="text-black font-semibold text-base bg-gray-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span>Account Details</span>
              <Badge className="bg-black text-white border-0 px-3 py-1">
                {profile.total_points || 0} pts
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm text-gray-500">Username</span>
              <p className="text-black font-medium">{profile.username || "Not set"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm text-gray-500">Email</span>
              <p className="text-black font-medium truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}