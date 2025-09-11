"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EventInterest {
  event_id: string;
  interest_level: number;
}

function ProfilePageContent() {
  const supabase = createClientComponentClient();
  const user = useUser();

  const [profile, setProfile] = useState<any>(null);
  const [artistEngagements, setArtistEngagements] = useState<any[]>([]);
  const [eventInterests, setEventInterests] = useState<EventInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Load profile
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Load engagements + events once profile ready
  useEffect(() => {
    if (user && profile && !profileLoading) {
      fetchArtistEngagements();
      fetchEventInterests();
    }
  }, [user, profile, profileLoading]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
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
      setProfileLoading(false);
    }
  };

  const fetchArtistEngagements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_engagements")
        .select(
          `
          artist_id,
          engagement_type,
          created_at,
          weekly_lists ( list_name ),
          weekly_list_artists ( artist_name, artist_image )
        `
        )
        .eq("user_id", user?.id);

      if (error) throw error;
      setArtistEngagements(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load artist engagements"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEventInterests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_interests")
        .select("event_id, interest_level")
        .eq("user_id", user?.id);

      if (error) throw error;
      setEventInterests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarFile(file);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

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

      fetchProfile();
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    }
  };

  if (profileLoading) {
    return <div className="text-white">Loading profile...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-neutral-800/80 border-neutral-700 text-white">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile?.avatar_url} alt="Profile" />
            <AvatarFallback>
              {profile?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">{profile?.username}</p>
            <p className="text-sm text-neutral-400">{profile?.email}</p>
            <p className="text-sm text-neutral-400">
              Joined {profile?.created_at ? formatDate(profile.created_at) : ""}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <Input type="file" accept="image/*" onChange={handleAvatarChange} />
              <Button variant="secondary" disabled={!avatarFile}>
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Artist Favorites */}
      <Card className="bg-neutral-800/80 border-neutral-700 text-white">
        <CardHeader>
          <CardTitle>My Artist Favorites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading artist engagements...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : artistEngagements.length === 0 ? (
            <div>No artist engagements found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {artistEngagements.map((engagement, index) => (
                <div
                  key={`${engagement.artist_id}-${index}`}
                  className="flex flex-col items-center"
                >
                  <Avatar className="w-20 h-20 mb-2">
                    <AvatarImage
                      src={engagement.weekly_list_artists?.artist_image}
                      alt={engagement.weekly_list_artists?.artist_name}
                    />
                    <AvatarFallback>
                      {engagement.weekly_list_artists?.artist_name?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-center">
                    {engagement.weekly_list_artists?.artist_name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {engagement.engagement_type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProfilePage() {
  return <ProfilePageContent />;
}
