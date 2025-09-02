"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ArtistProfileLookup() {
  const supabase = createClientComponentClient();
  const [query, setQuery] = useState("");
  const [artist, setArtist] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setArtist(null);

    const { data, error } = await supabase
      .from("artists")
      .select("artist_name, artist_home, artist_genre, artist_videolink")
      .ilike("artist_name", `%${query}%`)
      .limit(1)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setArtist(data);
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">OTW Artist Profile Database</h2>

      <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Enter artist name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Search
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {artist && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">{artist.artist_name}</h3>
          <p><strong>Home:</strong> {artist.artist_home || "N/A"}</p>
          <p><strong>Genre:</strong> {artist.artist_genre || "N/A"}</p>
          {artist.artist_videolink && (
            <button
              onClick={() => setShowVideo(true)}
              className="text-blue-600 underline"
            >
              Watch Video
            </button>
          )}
        </div>
      )}

      {/* Video Popup */}
      {showVideo && artist?.artist_videolink && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setShowVideo(false)}
            >
              ✕
            </button>
            <iframe
              src={artist.artist_videolink}
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
