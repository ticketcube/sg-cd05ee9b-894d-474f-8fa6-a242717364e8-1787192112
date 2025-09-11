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
  event_name: string;
  venue_name: string;
  venue_city: string;
  event_date: string;
  event_time: string;
  event_url: string;
  want_tickets: number;
  share_with_friends: number;
}

function ProfilePageContent() {
    const { user, profile, loading: profileLoading } = useUserProfile();
    const [eventInterests, setEventInterests] = useState<EventInterest[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Since AppLayout ensures user is authenticated, fetch data when profile is ready
        if (user && profile && !profileLoading) {
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

    const fetchEventInterests = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: events, error: eventsError } = await supabase
                .from('ticketmaster_events')
                .select('event_name, venue_name, venue_city, event_date, event_time, event_url')
                .eq('venue_city', 'Los Angeles')
                .gt('event_date', new Date().toISOString())
                .or('event_name.ilike.%Addison Rae%,event_name.ilike.%Laufey%,event_name.ilike.%Japanese Breakfast%')
                .order('event_date', { ascending: true });

            if (eventsError) throw eventsError;

            const eventsWithInterests: EventInterest[] = (events || []).map(event => ({
                ...event,
                want_tickets: 1,
                share_with_friends: 1
            }));

            setEventInterests(eventsWithInterests);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load event interests");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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

    // Error state for event loading
    if (error && !loading) {
        return (
            <div className="flex-1 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="text-center max-w-md mx-auto p-6">
                        <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-xl font-bold text-red-400 mb-4">Error Loading Data</h1>
                        <p className="text-neutral-300 mb-6">{error}</p>
                        <Button 
                            onClick={() => {
                                setError(null);
                                fetchEventInterests();
                            }}
                            variant="outline"
                            className="px-6 py-2 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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

                {/* Event Interests Section */}
                <Card className="bg-neutral-800/80 backdrop-blur-sm border-neutral-700/60 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg md:text-xl text-white flex items-center gap-3">
                            <Heart className="w-5 h-5 text-red-400" />
                            My Event Interests
                        </CardTitle>
                        <p className="text-sm text-neutral-400">
                            Events for artists you're interested in • Los Angeles area
                        </p>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-neutral-400">Loading events...</p>
                            </div>
                        ) : eventInterests.length > 0 ? (
                            <div className="rounded-lg border border-neutral-600/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-neutral-700/50 hover:bg-neutral-700/50">
                                            <TableHead className="font-semibold text-neutral-200 text-sm">Event</TableHead>
                                            <TableHead className="font-semibold text-neutral-200 text-sm">Date & Time</TableHead>
                                            <TableHead className="text-center font-semibold text-neutral-200 text-sm hidden md:table-cell">Interest</TableHead>
                                            <TableHead className="text-center font-semibold text-neutral-200 text-sm hidden lg:table-cell">Share</TableHead>
                                            <TableHead className="text-center font-semibold text-neutral-200 text-sm">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {eventInterests.map((event, index) => (
                                            <TableRow key={index} className="hover:bg-neutral-700/30 transition-colors border-b border-neutral-600/30">
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">
                                                            {event.event_name}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-1">
                                                            {event.venue_name}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-start gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-200">
                                                                {formatDate(event.event_date)}
                                                            </p>
                                                            {event.event_time && (
                                                                <p className="text-xs text-neutral-400">
                                                                    {formatTime(event.event_time)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center hidden md:table-cell">
                                                    <Badge 
                                                        className={`${
                                                            event.want_tickets > 0 
                                                                ? 'bg-green-900/40 text-green-300 border-green-600/40 hover:bg-green-900/60' 
                                                                : 'bg-neutral-800/60 text-neutral-400 border-neutral-600/40'
                                                        } text-xs px-2 py-1`}
                                                        variant="outline"
                                                    >
                                                        <Ticket className="w-3 h-3 mr-1" />
                                                        {event.want_tickets > 0 ? 'Interested' : 'Not interested'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center hidden lg:table-cell">
                                                    <Badge 
                                                        className={`${
                                                            event.share_with_friends > 0 
                                                                ? 'bg-blue-900/40 text-blue-300 border-blue-600/40 hover:bg-blue-900/60' 
                                                                : 'bg-neutral-800/60 text-neutral-400 border-neutral-600/40'
                                                        } text-xs px-2 py-1`}
                                                        variant="outline"
                                                    >
                                                        <Share2 className="w-3 h-3 mr-1" />
                                                        {event.share_with_friends > 0 ? 'Will share' : 'Won\'t share'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {event.event_url && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs h-8 shadow-lg hover:shadow-blue-500/20 transition-all"
                                                        >
                                                            <a 
                                                                href={event.event_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1"
                                                            >
                                                                <span className="hidden sm:inline">Get Tickets</span>
                                                                <span className="sm:hidden">Tickets</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </Button>
                                                    )}
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
                                <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
                                <p className="text-neutral-400 max-w-sm mx-auto">
                                    We couldn't find any events for your favorite artists in Los Angeles right now. Check back soon!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default ProfilePageContent;


