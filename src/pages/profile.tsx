import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, MapPin, Calendar, ExternalLink, Heart, Share2, Ticket } from "lucide-react";
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

export default function ProfilePage() {
    const { user, supabaseUser, profileExists, loading: authLoading } = useAuth();
    const [eventInterests, setEventInterests] = useState<EventInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!supabaseUser || !profileExists) {
            setLoading(false);
            return;
        }

        fetchEventInterests();
    }, [supabaseUser, profileExists, authLoading]);

    const fetchEventInterests = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch events for our target artists in Los Angeles
            const { data: events, error: eventsError } = await supabase
                .from('ticketmaster_events')
                .select('event_name, venue_name, venue_city, event_date, event_time, event_url')
                .eq('venue_city', 'Los Angeles')
                .or('event_name.ilike.%Addison Rae%,event_name.ilike.%Laufey%,event_name.ilike.%Japanese Breakfast%')
                .order('event_date', { ascending: true });

            if (eventsError) throw eventsError;

            // Add hard-coded interest levels
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

    // Show loading while auth is initializing
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h1 className="text-xl font-semibold text-neutral-700">Loading your profile...</h1>
                </div>
            </div>
        );
    }

    // Handle authentication and profile setup cases
    if (!supabaseUser || !profileExists) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-800 mb-4">Profile Setup Required</h1>
                    <p className="text-neutral-600 mb-6">
                        {!supabaseUser ? 
                            "Please sign in to view your profile." : 
                            "Complete your profile setup to access all features."
                        }
                    </p>
                    <Button 
                        onClick={() => window.location.href = "/discovery-dashboard"} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                        {!supabaseUser ? "Sign In" : "Complete Setup"}
                    </Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Profile Error</h1>
                    <p className="text-neutral-600 mb-6">{error}</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        variant="outline"
                        className="px-6 py-2"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    {/* Page Header - Made much more compact */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-neutral-800 mb-1">My Profile</h1>
                        <p className="text-sm text-neutral-600">Manage your account and track your music interests</p>
                    </div>

                    {/* Compact Profile Header - Avatar/Name Left, Details Right */}
                    <div className="mb-6">
                        <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-6">
                                    {/* Left: Avatar and Name */}
                                    <div className="flex items-center gap-4">
                                        <div className="relative group">
                                            <Avatar className="w-16 h-16 border-2 border-blue-100">
                                                {user?.avatar_url ? (
                                                    <img 
                                                        src={user.avatar_url} 
                                                        alt={user.username || 'Profile'} 
                                                        className="w-full h-full object-cover rounded-full"
                                                    />
                                                ) : (
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                                                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            {/* Avatar Upload Button */}
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            >
                                                <User className="w-5 h-5 text-white" />
                                            </label>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-neutral-800">{user?.username || 'User'}</h2>
                                            <p className="text-sm text-neutral-600">Music Enthusiast</p>
                                        </div>
                                    </div>

                                    {/* Right: User Details Grid */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-neutral-700">Email</p>
                                                <p className="text-sm text-neutral-600 truncate">{user?.email || supabaseUser?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-green-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-neutral-700">Location</p>
                                                <p className="text-sm text-neutral-600">{user?.raw_city_input || 'Not specified'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-purple-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-neutral-700">Member Since</p>
                                                <p className="text-sm text-neutral-600">
                                                    {user?.created_at ? formatDate(user.created_at) : 'Recently'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Event Interests Table - Now full width */}
                    <div>
                        <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-neutral-800 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    My Event Interests
                                </CardTitle>
                                <p className="text-xs text-neutral-600">
                                    Events for artists you're interested in • Los Angeles area
                                </p>
                            </CardHeader>
                            <CardContent>
                                {eventInterests.length > 0 ? (
                                    <div className="rounded-lg border border-neutral-200 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-neutral-50/50">
                                                    <TableHead className="font-semibold text-neutral-700">Event</TableHead>
                                                    <TableHead className="font-semibold text-neutral-700">Date & Venue</TableHead>
                                                    <TableHead className="text-center font-semibold text-neutral-700">Want Tickets</TableHead>
                                                    <TableHead className="text-center font-semibold text-neutral-700">Share</TableHead>
                                                    <TableHead className="text-center font-semibold text-neutral-700">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {eventInterests.map((event, index) => (
                                                    <TableRow key={index} className="hover:bg-blue-50/30 transition-colors">
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                <p className="text-neutral-800 font-semibold text-sm">
                                                                    {event.event_name}
                                                                </p>
                                                                <p className="text-xs text-neutral-600 mt-1">
                                                                    {event.venue_name}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-start gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-neutral-700">
                                                                        {formatDate(event.event_date)}
                                                                    </p>
                                                                    {event.event_time && (
                                                                        <p className="text-xs text-neutral-500">
                                                                            {formatTime(event.event_time)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center">
                                                                <Badge 
                                                                    className={`${
                                                                        event.want_tickets > 0 
                                                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                                                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                                    } text-xs px-2 py-1`}
                                                                    variant="outline"
                                                                >
                                                                    <Ticket className="w-3 h-3 mr-1" />
                                                                    {event.want_tickets > 0 ? 'Interested' : 'Not interested'}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex justify-center">
                                                                <Badge 
                                                                    className={`${
                                                                        event.share_with_friends > 0 
                                                                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                                                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                                    } text-xs px-2 py-1`}
                                                                    variant="outline"
                                                                >
                                                                    <Share2 className="w-3 h-3 mr-1" />
                                                                    {event.share_with_friends > 0 ? 'Will share' : 'Won\'t share'}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {event.event_url && (
                                                                <Button
                                                                    asChild
                                                                    size="sm"
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs h-8"
                                                                >
                                                                    <a 
                                                                        href={event.event_url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        Get Tickets
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
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                                            <Heart className="w-8 h-8 text-neutral-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No events found</h3>
                                        <p className="text-neutral-600 max-w-sm mx-auto">
                                            We couldn't find any events for your favorite artists in Los Angeles right now.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}