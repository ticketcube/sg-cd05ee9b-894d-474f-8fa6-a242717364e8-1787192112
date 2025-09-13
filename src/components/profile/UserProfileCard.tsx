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
                <CardContent className="flex items-center justify-center p-4 text-gray-400 text-sm animate-pulse">
                    Loading...
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
            toast({ variant: "destructive", title: "Invalid Username", description: "Username cannot be empty" });
            return;
        }
        if (newUsername === profile?.username) return setIsEditingUsername(false);

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('user_profiles')
                .update({ username: newUsername.trim() })
                .eq('user_id', user.id);

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
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-md sm:text-lg font-medium text-black">
                    <Avatar className="h-10 w-10 bg-gray-100 border border-gray-200">
                        <AvatarFallback className="text-black font-semibold text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-base">Account Settings</span>
                            <Badge className="bg-black text-white border-0 px-2 py-0.5 text-xs sm:text-sm">
                                {profile.total_points || 0} pts
                            </Badge>
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {/* Username */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-all">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">Username</span>
                        {isEditingUsername ? (
                            <div className="flex gap-2 items-center">
                                <Input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="h-8 text-sm flex-1"
                                    placeholder="Enter username"
                                />
                                <Button size="sm" onClick={handleUsernameSave} disabled={isSaving} className="h-8 px-3 bg-black hover:bg-gray-800 flex-shrink-0">
                                    <Save className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Save</span>
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleUsernameCancel} className="h-8 px-3 flex-shrink-0">
                                    <X className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Cancel</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-black font-medium text-sm truncate">{profile.username || "Not set"}</p>
                                <Button size="sm" variant="ghost" onClick={handleUsernameEdit} className="h-8 px-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md flex-shrink-0">
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">Email</span>
                        <p className="text-black text-sm truncate">{user.email}</p>
                    </div>
                </div>

                {/* Password */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <Key className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 flex justify-between items-center min-w-0">
                        <div>
                            <span className="text-xs sm:text-sm font-medium text-gray-600 block mb-1">Password</span>
                            <p className="text-black text-sm">••••••••</p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 px-3 text-gray-600 hover:bg-gray-100 hover:text-black">
                                    <Key className="h-3 w-3 mr-1" /> Reset
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm mx-2 bg-white border border-gray-200">
                                <DialogHeader>
                                    <DialogTitle className="text-black">Reset Password</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs sm:text-sm text-black">Email</Label>
                                    <Input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="bg-white border-gray-200 text-black h-9 text-sm"
                                    />
                                    <p className="text-xs text-gray-500">We'll send you a secure link to reset your password.</p>
                                    <Button
                                        onClick={handlePasswordReset}
                                        disabled={isResettingPassword || !resetEmail}
                                        className="w-full bg-black hover:bg-gray-800 text-white h-9 text-sm"
                                    >
                                        {isResettingPassword ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
