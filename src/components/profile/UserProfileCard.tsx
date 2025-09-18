import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Key, Edit, Save, X, Shield, Settings } from "lucide-react";
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
            <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="flex items-center justify-center p-8 text-gray-400 animate-pulse">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const initials = profile.username ? profile.username.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U";

    const handleUsernameSave = async () => {
        if (!newUsername.trim()) {
            toast({ variant: "destructive", title: "Invalid Username", description: "Username cannot be empty" });
            return;
        }
        if (newUsername === profile?.username) return setIsEditingUsername(false);

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from("user_profiles")
                .update({ username: newUsername.trim() })
                .eq("user_id", user.id);
            if (error) throw error;
            await refreshProfile();
            setIsEditingUsername(false);
            toast({ title: "Username Updated", description: "Your username has been successfully updated." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Update Failed", description: "Try again." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUsernameCancel = () => setIsEditingUsername(false);

    const handlePasswordReset = async () => {
        try {
            setIsResettingPassword(true);
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
            });
            if (error) throw error;
            toast({ title: "Password Reset Sent", description: "Check your email for a link to reset your password." });
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Reset Failed", description: "Try again." });
        } finally {
            setIsResettingPassword(false);
        }
    };

    return (
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                    <Settings className="h-6 w-6 text-gray-500" />
                    Account Settings
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100">
                    <Avatar className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-lg">
                        <AvatarFallback className="text-white font-bold text-xl bg-transparent">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {profile.username || "Music Lover"}
                        </h3>
                        <p className="text-gray-600 mt-1">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-medium">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified User
                            </Badge>
                            <Badge variant="outline" className="border-gray-300 text-gray-600">
                                {profile.total_points || 0} Points
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Username
                        </Label>
                        {isEditingUsername ? (
                            <div className="flex gap-2">
                                <Input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="flex-1 h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                    placeholder="Enter username"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleUsernameSave}
                                    disabled={isSaving}
                                    className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleUsernameCancel}
                                    className="h-10 px-4 border-gray-300 hover:bg-gray-50"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="flex-1 text-gray-900 font-medium">
                                    {profile.username || "Not set"}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsEditingUsername(true)}
                                    className="h-8 px-3 text-gray-500 hover:text-gray-900 hover:bg-white"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Email Section */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                        </Label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="flex-1 text-gray-900 font-medium truncate">
                                {user.email}
                            </span>
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                Verified
                            </Badge>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Password
                        </Label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="flex-1 text-gray-900 font-medium">
                                ••••••••••••
                            </span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-4 border-gray-300 hover:bg-white text-gray-700"
                                    >
                                        Reset Password
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-semibold text-gray-900">
                                            Reset Your Password
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Email Address
                                            </Label>
                                            <Input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            We'll send a secure reset link to your email address.
                                        </p>
                                        <Button
                                            onClick={handlePasswordReset}
                                            disabled={isResettingPassword || !resetEmail}
                                            className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                                        >
                                            {isResettingPassword ? "Sending..." : "Send Reset Link"}
                                        </Button>
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
