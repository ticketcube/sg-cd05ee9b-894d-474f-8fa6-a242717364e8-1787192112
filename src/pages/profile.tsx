import React, { useState } from "react";
import Head from "next/head";
import { useUserProfile } from "@/contexts/UserProfileContext";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardAuthBlock from "@/components/dashboard/DashboardAuthBlock";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FavoriteArtistsGrid } from "@/components/profile/FavoriteArtistsGrid";
import { MvpSurvey } from "@/components/profile/MvpSurvey";
import { User, Mail, Edit, KeyRound, Shield } from "lucide-react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { profile, user, loading: profileLoading, isAuthenticated } = useUserProfile();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  if (profileLoading) return <DashboardLoading />;
  
  if (!isAuthenticated) {
    return (
      <DashboardAuthBlock
        showAuthDialog={showAuthDialog}
        setShowAuthDialog={setShowAuthDialog}
      />
    );
  }

  if (!profile || !user) {
    return <DashboardLoading />;
  }

  const initials = profile.username
    ? profile.username.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "F";

  const isAdmin = profile.role === "admin";

  const handleEditUsername = async () => {
    if (!isEditingUsername) {
      setNewUsername(profile.username || "");
      setIsEditingUsername(true);
      return;
    }

    if (!newUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ username: newUsername.trim() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Username updated",
        description: "Your username has been successfully updated",
      });
      setIsEditingUsername(false);
    } catch (error) {
      console.error("Error updating username:", error);
      toast({
        title: "Update failed",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!user.email) return;
    
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Reset failed",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      <Head>
        <title>Profile | OnesToWatch</title>
        <meta
          name="description"
          content="Your personal OTW Chart profile, survey, and favorite artists."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-slate-900">Fan Profile</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Fan Profile Header */}
            <Card className="bg-white border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <Avatar className="h-20 w-20 border-4 border-purple-100 shadow-md bg-gradient-to-br from-purple-100 to-pink-100">
                    <AvatarFallback className="text-purple-700 font-bold text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      {isEditingUsername ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="text-2xl font-bold text-slate-900 border-b-2 border-purple-400 outline-none bg-transparent"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleEditUsername}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingUsername(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-slate-900">
                            {profile.username || "Fan"}
                          </h2>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditUsername}
                            className="h-7 w-7 p-0 hover:bg-purple-50"
                          >
                            <Edit className="w-4 h-4 text-purple-600" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col items-center sm:items-start gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={isResettingPassword}
                        className="h-8 px-3 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        {isResettingPassword ? "Sending..." : "Reset Password"}
                      </Button>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/staffdashboard")}
                        className="border-blue-300 hover:bg-blue-50 text-blue-700 font-medium"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Staff Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Favorite Artists */}
            <div className="overflow-hidden">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <FavoriteArtistsGrid />
              </div>
            </div>

            {/* Survey */}
            <div className="overflow-hidden">
              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg shadow-md overflow-hidden">
                <MvpSurvey />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}