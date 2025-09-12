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
        {/* Three Horizontal Sections Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-3 md:gap-4">
          {/* Username Section */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/50 transition-all">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-600 block mb-1">Username</span>
              {isEditingUsername ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-10 text-sm bg-white border-gray-200 text-black flex-1"
                    placeholder="Enter username"
                  />
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={handleUsernameSave}
                      disabled={isSaving}
                      className="h-10 px-4 bg-black hover:bg-gray-800 flex-1 sm:flex-initial"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUsernameCancel}
                      className="h-10 px-4 border-gray-200 flex-1 sm:flex-initial"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="sm:hidden">Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1 gap-2">
                  <p className="text-black font-medium truncate flex-1">{profile.username || "Not set"}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUsernameEdit}
                    className="h-9 px-3 text-gray-500 hover:text-black hover:bg-gray-100 flex-shrink-0 rounded-md"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="ml-1 text-sm sm:hidden">Edit</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Email Section */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-600 block mb-1">Email Address</span>
              <p className="text-black font-medium truncate text-sm sm:text-base">{user.email}</p>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Key className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between min-w-0 gap-3 sm:gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-600 block mb-1">Password</span>
                <p className="text-black font-medium text-sm sm:text-base">••••••••</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-4 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black flex-shrink-0 w-full sm:w-auto justify-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-4 bg-white border border-gray-200">
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
                        className="bg-white border-gray-200 text-black h-11"
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
                        className="flex-1 bg-black hover:bg-gray-800 text-white h-11"
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