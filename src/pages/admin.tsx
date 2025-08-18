import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Database, RefreshCw, Calendar, Users, ListPlus } from "lucide-react";
import { eventCacheService } from "@/services/eventCacheService";
import { weeklyListService } from "@/services/weeklyListService";
import { createClient } from "@supabase/supabase-js";


// Mock admin check - in a real app, this would involve a secure check
const checkAdminAccess = async (email: string): Promise<boolean> => {
    const adminEmails = ["admin@otw.com", "alan@alanrakov.com"];
    return adminEmails.includes(email.toLowerCase());
};

/** -----------------------------
 *  ArtistForm (local component)
 * ----------------------------- */
function ArtistForm() {
    const [artist, setArtist] = useState("");
    const [youtube, setYoutube] = useState("");
    const [image, setImage] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!artist) {
            setMessage("Please enter an artist name.");
            return;
        }

        // 1. Check if artist exists
        const { data: existing, error: checkError } = await supabase
            .from("artists")
            .select("*")
            .eq("artist_name", artist)
            .maybeSingle(); // safer than .single()

        if (checkError) {
            console.error(checkError);
            setMessage("Error checking artist.");
            return;
        }

        if (existing) {
            setMessage("Artist already exists in database.");
            return;
        }

        // 2. Insert new artist
        const { error: insertError } = await supabase.from("artists").insert([
            {
                artist_name: artist,
                artist_videolink: youtube,
                artist_image: image,
            },
        ]);

        if (insertError) {
            console.error(insertError);
            setMessage("Error inserting artist.");
        } else {
            setMessage("✅ Artist added successfully!");
            setArtist("");
            setYoutube("");
            setImage("");
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Add Artist</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <input
                    type="text"
                    placeholder="Artist Name"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="border p-2 rounded"
                />
                <input
                    type="text"
                    placeholder="YouTube Video URL"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="border p-2 rounded"
                />
                <input
                    type="text"
                    placeholder="Image URL"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="border p-2 rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Save Artist
                </button>
            </form>
            {message && <p className="mt-3 text-sm">{message}</p>}
        </div>
    );
}

/** -----------------------------
 *  AdminPage (default export)
 * ----------------------------- */
export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ totalEvents: 0, activeArtists: 0, lastUpdated: null as string | null });
    const [refreshResult, setRefreshResult] = useState < string | null > (null);
    const [creatingList, setCreatingList] = useState(false);
    const [listCreationResult, setListCreationResult] = useState < string | null > (null);

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadStats();
        }
    }, [isAdmin]);

    const loadStats = async () => {
        try {
            const eventStats = await eventCacheService.getEventStats();
            setStats(eventStats);
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        const adminStatus = await checkAdminAccess(email);
        setIsAdmin(adminStatus);
        setLoading(false);
        if (!adminStatus) {
            alert("Access Denied. Please check the email and try again.");
        }
    };

    const handleRefreshAllEvents = async () => {
        setRefreshing(true);
        setRefreshResult(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

            const response = await fetch("/api/admin/refresh-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setRefreshResult(
                    `✅ Success! Refreshed events for all artists. Found ${data.stats.totalEvents} total events across ${data.stats.activeArtists} artists.`
                );
                await loadStats();
            } else {
                setRefreshResult(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error refreshing events:", error);
            if (error instanceof Error && error.name === "AbortError") {
                setRefreshResult(`❌ Error: Request timed out after 5 minutes.`);
            } else {
                setRefreshResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateSampleList = async () => {
        setCreatingList(true);
        setListCreationResult(null);
        try {
            const list = await weeklyListService.createSampleWeeklyList();
            setListCreationResult(`✅ Success! Created sample list "${list.title}" with ID ${list.week_identifier}.`);
        } catch (error) {
            console.error("Error creating sample list:", error);
            setListCreationResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setCreatingList(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="p-8 max-w-md mx-auto mt-10">
                <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
                <div className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Enter admin email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                    <Button onClick={handleVerify} className="w-full">
                        Verify Access
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Welcome, Admin! Manage event cache and system operations.</p>

            {/* Event Cache Stats */}
            {/* ... your existing EventCache and Weekly List UI ... */}

            {/* Add Artist */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Add Artist</CardTitle>
                </CardHeader>
                <CardContent>
                    <ArtistForm />
                </CardContent>
            </Card>
        </div>
    );
}
