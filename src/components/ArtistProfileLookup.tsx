"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ArtistProfileLookup() {
    const supabase = createClientComponentClient();
    const [query, setQuery] = useState("");
    const [artist, setArtist] = useState < any | null > (null);
    const [error, setError] = useState < string | null > (null);
    const [showVideo, setShowVideo] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchArtist = async (search: string) => {
        if (!search.trim()) {
            setArtist(null);
            setError(null);
            return; 
        }

        setLoading(true);
        setError(null);
        setArtist(null);

        const { data, error } = await supabase
            .from("artists")
            .select("artist_name, artist_home, artist_genre, artist_videolink")
            .ilike("artist_name", `%${search}%`)
            .limit(1);

        if (error) {
            setError(error.message);
        } else {
            setArtist(data?.[0] ?? null); // ✅ Grab first row
        }

        setLoading(false);
    };

    // 🔎 Search-as-you-type with 400ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchArtist(query);
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchArtist(query);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
                OTW Artist Profile Database
            </h2>
            <p className="text-gray-300 text-lg">Staff-only tools and dashboards</p>

            {/* Input + Button */}
            <form onSubmit={handleSubmit} className="flex space-x-2 mb-6 max-w-md">
                <input
                    type="text"
                    placeholder="Enter artist name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-black placeholder-gray-500 bg-white"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Search
                </button>
            </form>

            {/* Show query */}
            {query && (
                <p className="text-gray-400 italic">
                    Searching for: <span className="font-semibold">{query}</span>
                </p>
            )}

            {/* Loading */}
            {loading && <p className="text-gray-300">Loading...</p>}

            {/* Error */}
            {error && <p className="text-red-500">{error}</p>}

            {/* Result */}
            {artist && (
                <div className="p-4 bg-gray-800 rounded-lg space-y-2 shadow-md">
                    <h3 className="text-xl font-bold text-white">{artist.artist_name}</h3>
                    <p className="text-gray-300">
                        <strong>Home:</strong> {artist.artist_home || "N/A"}
                    </p>
                    <p className="text-gray-300">
                        <strong>Genre:</strong> {artist.artist_genre || "N/A"}
                    </p>
                    {artist.artist_videolink && (
                        <button
                            onClick={() => setShowVideo(true)}
                            className="text-blue-400 underline hover:text-blue-500"
                        >
                            Watch Video
                        </button>
                    )}
                </div>
            )}

            {/* Video Popup */}
            {showVideo && artist?.artist_videolink && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-4 max-w-lg w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-black"
                            onClick={() => setShowVideo(false)}
                        >
                            ✕
                        </button>
                        <iframe
                            src={artists.artist_videolink}
                            className="w-full h-64 rounded-lg"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}
