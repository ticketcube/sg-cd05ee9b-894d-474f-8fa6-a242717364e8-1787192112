import { useState, useEffect } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, MapPin, Calendar, ExternalLink, Heart, Share2, Ticket, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EventInterest {
    event_id: string;
    interest_level: number;
}

function ProfilePageContent() {
    const {user, profile, loading: profileLoading } = useUserProfile();
    const [artistEngagements, setArtistEngagements] = useState<any[]>([]);
    const [eventInterests, setEventInterests] = useState <EventInterest[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchArtistEngagements = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("user_engagements")
                .select("x_quadrant, y_quadrant, artists (artist_name, artist_image)")
                .eq("user_id", user?.id);

            if (error) throw error;

            const transformed = (data || [])
                .map((row: any) => {
                    const score = (row.x_quadrant + row.y_quadrant) / 2;
                    let category = "Worth Exploring";
                    if (score > 0.7) category = "Top Favorite";
                    else if (score > 0.4) category = "On Your Radar";
                    return {
                        artist_name: row.artists.artist_name,
                        artist_image: row.artists.artist_image,
                        score,
                        category,
                    };
                })
                .sort((a, b) => b.score - a.score);

            setArtistEngagements(transformed);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load artists");
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

    useEffect(() => {
        if (user && profile && !profileLoading) {
            fetchArtistEngagements();
            fetchEventInterests();
        }
    }, [user, profile, profileLoading]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            setUploadingAvatar(true);
            
            const fileExt = file.name.split('.').pop();
            const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: publicUrl })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            window.location.reload();

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setError(error instanceof Error ? error.message : 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    
    // Show loading only while profile is being loaded initially
    if (profileLoading) {
        return (
            <div className="flex-1 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h1 className="text-xl font-semibold text-neutral-300">Loading your profile...</h1>
                </div>
            </div>
        );
    }
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
   
    // Main profile content - user and profile are guaranteed by AppLayout
    return (
        <div className="flex-1 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Page Header */}
                <div className="mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-sm md:text-base text-neutral-400">Manage your account and track your music interests</p>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="mb-8">
                    <Card className="bg-neutral-800/80 backdrop-blur-sm border-neutral-700/60 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Avatar className="w-16 md:w-20 h-16 md:h-20 border-2 border-blue-400/40 ring-2 ring-blue-500/20">
                                            {profile?.avatar_url ? (
                                                <img 
                                                    src={profile.avatar_url} 
                                                    alt={profile?.username || 'Profile'} 
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl md:text-2xl font-bold">
                                                    {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            disabled={uploadingAvatar}
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className={`absolute inset-0 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploadingAvatar ? 'opacity-100' : ''}`}
                                        >
                                            {uploadingAvatar ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-white" />
                                            )}
                                        </label>
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-white">{profile?.username || 'Music Lover'}</h2>
                                        <p className="text-sm text-blue-400">Music Enthusiast</p>
                                    </div>
                                </div>

                                {/* User Info Grid */}
                                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700/40 border border-neutral-600/30">
                                        <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-neutral-300">Email</p>
                                            <p className="text-sm text-white truncate">{profile?.email || user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700/40 border border-neutral-600/30">
                                        <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-neutral-300">Location</p>
                                            <p className="text-sm text-white">{profile?.raw_city_input || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700/40 border border-neutral-600/30 sm:col-span-2 lg:col-span-1">
                                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-neutral-300">Member Since</p>
                                            <p className="text-sm text-white">
                                                {profile?.created_at ? formatDate(profile.created_at) : 'Recently'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

       
                <Card className="bg-neutral-800/80 backdrop-blur-sm border-neutral-700/60 shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg md:text-xl text-white flex items-center gap-3">
                            <Heart className="w-5 h-5 text-pink-400" />
                            My Artist Favorites
                        </CardTitle>
                        <p className="text-sm text-neutral-400">
                            Based on your ratings • sorted by strongest interest
                        </p>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-neutral-400">Loading your artists...</p>
                            </div>
                        ) : artistEngagements.length > 0 ? (
                            <div className="rounded-lg border border-neutral-600/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-neutral-700/50 hover:bg-neutral-700/50">
                                            <TableHead className="font-semibold text-neutral-200 text-sm">Artist</TableHead>
                                            <TableHead className="font-semibold text-neutral-200 text-sm text-center">Category</TableHead>
                                            <TableHead className="font-semibold text-neutral-200 text-sm text-center">Score</TableHead>
                                            <TableHead className="font-semibold text-neutral-200 text-sm text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {artistEngagements.map((artist, index) => (
                                            <TableRow key={index} className="hover:bg-neutral-700/30 transition-colors border-b border-neutral-600/30">
                                                {/* Artist Avatar + Name */}
                                                <TableCell className="flex items-center gap-3 py-3">
                                                    <Avatar className="w-10 h-10 border border-neutral-600">
                                                        {artist.artist_image ? (
                                                            <img src={artist.artist_image} alt={artist.artist_name} className="w-full h-full object-cover rounded-full" />
                                                        ) : (
                                                            <AvatarFallback>{artist.artist_name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <span className="text-white font-medium">{artist.artist_name}</span>
                                                </TableCell>

                                                {/* Friendly Category */}
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={
                                                            artist.category === "Top Favorite"
                                                                ? "bg-green-900/40 text-green-300 border-green-600/40"
                                                                : artist.category === "On Your Radar"
                                                                    ? "bg-blue-900/40 text-blue-300 border-blue-600/40"
                                                                    : "bg-neutral-700/60 text-neutral-300 border-neutral-600/40"
                                                        }
                                                        variant="outline"
                                                    >
                                                        {artist.category}
                                                    </Badge>
                                                </TableCell>

                                                {/* Score visualization */}
                                                <TableCell className="text-center text-neutral-300">
                                                    {(artist.score * 100).toFixed(0)}%
                                                </TableCell>

                                                {/* Ticket button (popup placeholder) */}
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 text-xs h-8 shadow-lg hover:shadow-pink-500/20"
                                                        onClick={() => alert("Coming Soon 🚀")}
                                                    >
                                                        <Ticket className="w-3 h-3 mr-1" />
                                                        Tickets
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <Heart className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No artists rated yet</h3>
                                <p className="text-neutral-400 max-w-sm mx-auto">
                                    Rate some artists to see your personalized favorites here!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

        </div>
    );
}

export default ProfilePageContent;


