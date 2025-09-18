import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Key, Edit, Save, X } from "lucide-react";
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



        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-medium text-black">
                    <Avatar className="h-8 w-8 bg-gray-100 border border-gray-200">
                        <AvatarFallback className="text-black font-semibold text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center justify-between">
                        <span>Your Profile</span>
                        <Badge className="bg-black text-white border-0 px-2 py-0.5 text-[10px] sm:text-xs">
                            {profile.total_points || 0} pts
                        </Badge>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                    {/* Username */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="text-[10px] text-gray-500 block">Username</span>
                            {isEditingUsername ? (
                                <div className="flex gap-1 items-center">
                                    <Input
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="h-7 text-xs flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleUsernameSave}
                                        disabled={isSaving}
                                        className="h-7 px-2 bg-black hover:bg-gray-800"
                                    >
                                        <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleUsernameCancel}
                                        className="h-7 px-2"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-black text-xs truncate">
                                        {profile.username || "Not set"}
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsEditingUsername(true)}
                                        className="h-7 px-1 text-gray-500 hover:text-black"
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-gray-500 block">Email</span>
                            <p className="text-black text-xs truncate">{user.email}</p>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="col-span-2 flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <Key className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] text-gray-500 block">Password</span>
                                <p className="text-black text-xs">••••••••</p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="link"
                                        className="h-7 px-1 text-xs text-gray-600 hover:text-black"
                                    >
                                        Reset
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-sm mx-2 bg-white border border-gray-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-black text-sm">
                                            Reset Password
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs text-black">Email</Label>
                                        <Input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="bg-white border-gray-200 text-black h-8 text-xs"
                                        />
                                        <p className="text-[10px] text-gray-500">
                                            We'll send a secure link.
                                        </p>
                                        <Button
                                            onClick={handlePasswordReset}
                                            disabled={isResettingPassword || !resetEmail}
                                            className="w-full bg-black hover:bg-gray-800 text-white h-8 text-xs"
                                        >
                                            {isResettingPassword ? "Sending..." : "Send Link"}
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
