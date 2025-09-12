import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Trophy, Edit, Key, Save, X } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function UserProfileCard() {
  const { profile, user, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || "");

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

  const handleUsernameEdit = () => {
    setNewUsername(profile?.username || "");
    setIsEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    if (!newUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description: "Username cannot be empty"
      });
      return;
    }

    if (newUsername === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ username: newUsername.trim() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating username:', error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Failed to update username. Please try again."
        });
        return;
      }

      await refreshProfile();
      setIsEditingUsername(false);
      
      toast({
        title: "Username Updated",
        description: "Your username has been successfully updated."
      });

    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameCancel = () => {
    setNewUsername(profile?.username || "");
    setIsEditingUsername(false);
  };

  const handlePasswordReset = async () => {
    try {
      setIsResettingPassword(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        console.error('Error sending password reset:', error);
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: error.message || "Failed to send password reset email."
        });
        return;
      }

      toast({
        title: "Password Reset Sent",
        description: "Check your email for a link to reset your password."
      });

    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

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
              <span>Account Settings</span>
              <Badge className="bg-black text-white border-0 px-3 py-1">
                {profile.total_points || 0} pts
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Three Horizontal Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Username Section */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-500 block">Username</span>
              {isEditingUsername ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-8 text-sm bg-white border-gray-200 text-black"
                    placeholder="Enter username"
                  />
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={handleUsernameSave}
                      disabled={isSaving}
                      className="h-8 w-8 p-0 bg-black hover:bg-gray-800"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUsernameCancel}
                      className="h-8 w-8 p-0 border-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-black font-medium truncate">{profile.username || "Not set"}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUsernameEdit}
                    className="h-7 px-2 text-gray-500 hover:text-black hover:bg-gray-100 flex-shrink-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Email Section */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-500 block">Email</span>
              <p className="text-black font-medium truncate mt-1">{user.email}</p>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Key className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 flex items-start justify-between min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-sm text-gray-500 block">Password</span>
                <p className="text-black font-medium mt-1">••••••••</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black flex-shrink-0 ml-2"
                  >
                    Reset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-gray-200">
                  <DialogHeader>
                    <DialogTitle className="text-black">Reset Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-black">Email Address</Label>
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="bg-white border-gray-200 text-black"
                        placeholder="Enter your email"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      We'll send you a secure link to reset your password.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handlePasswordReset}
                        disabled={isResettingPassword || !resetEmail}
                        className="flex-1 bg-black hover:bg-gray-800 text-white"
                      >
                        {isResettingPassword ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : (
                          'Send Reset Link'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}