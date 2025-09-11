
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserEngagementQuadrants } from "@/components/profile/UserEngagementQuadrants";
import { Calendar, User, Mail, Upload, Camera } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  city?: string;
  bio?: string;
}

function ProfilePageContent() {
  const supabase = createClientComponentClient();
  const user = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await fetchProfile();
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white animate-pulse text-lg">Loading your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-red-900/20 border-red-500/40 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-400 text-lg mb-2">Error Loading Profile</div>
                <p className="text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-neutral-900/95 to-neutral-800/95 border-neutral-700/60 shadow-2xl shadow-neutral-900/40 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <CardContent className="relative pt-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Avatar Section */}
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white/10 shadow-2xl shadow-neutral-900/60">
                  <AvatarImage src={profile?.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-3xl font-light bg-gradient-to-br from-neutral-700 to-neutral-800">
                    {profile?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Avatar Upload Overlay */}
                <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer flex items-center justify-center">
                  <div className="flex flex-col items-center text-white">
                    {uploadingAvatar ? (
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-xs">Change</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-light tracking-wide text-white mb-2">
                    {profile?.username || "Anonymous User"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm">{profile?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm">
                        Joined {profile?.created_at ? formatDate(profile.created_at) : ""}
                      </span>
                    </div>
                    {profile?.city && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm">{profile.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {profile?.bio && (
                  <div className="bg-neutral-800/40 rounded-lg p-4 border border-neutral-700/40">
                    <p className="text-neutral-300 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    Active Member
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-500/10">
                    Music Enthusiast
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artist Rating Quadrants */}
        <UserEngagementQuadrants userId={user?.id || ""} />

        {/* Additional Stats Card */}
        <Card className="bg-gradient-to-br from-neutral-900/90 to-neutral-800/90 border-neutral-700/60 text-white">
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wide">Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-3xl font-bold text-emerald-400 mb-2">0</div>
                <div className="text-sm text-neutral-400">Playlists Created</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl">
                <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
                <div className="text-sm text-neutral-400">Events Attended</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl">
                <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
                <div className="text-sm text-neutral-400">Friends Connected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
