
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Music } from "lucide-react";
import { artistService } from "@/services/artistService";
import type { ArtistWithLocation, MapMarkerData } from "@/types/map";
import Image from "next/image";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import react-leaflet components to prevent SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

interface ArtistPopupProps {
  artists: ArtistWithLocation[];
  cityName: string;
}

function ArtistPopup({ artists, cityName }: ArtistPopupProps) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithLocation | null>(null);

  if (selectedArtist) {
    return (
      <div className="w-80 max-h-96 overflow-y-auto bg-white text-black">
        <div className="flex items-center justify-between mb-3 p-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedArtist(null)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            ← Back to {cityName}
          </Button>
        </div>
        
        <div className="space-y-4 p-3">
          <div className="flex items-center space-x-3">
            {selectedArtist.artist_image && (
              <Image
                src={selectedArtist.artist_image}
                alt={selectedArtist.artist_name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-bold text-lg text-black">{selectedArtist.artist_name}</h3>
              {selectedArtist.artist_genre && (
                <Badge variant="secondary" className="text-xs">
                  {selectedArtist.artist_genre}
                </Badge>
              )}
            </div>
          </div>

          {selectedArtist.artist_bio && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {selectedArtist.artist_bio}
            </p>
          )}

          <div className="flex space-x-2">
            {selectedArtist.artist_videolink && (
              <Button
                size="sm"
                onClick={() => window.open(selectedArtist.artist_videolink, "_blank")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Music className="w-4 h-4 mr-1" />
                Video
              </Button>
            )}
            {selectedArtist.artist_audiolink && (
              <Button
                size="sm"
                onClick={() => window.open(selectedArtist.artist_audiolink, "_blank")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Music className="w-4 h-4 mr-1" />
                Audio
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 max-h-80 overflow-y-auto bg-white text-black">
      <div className="flex items-center mb-3 p-3 border-b">
        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-bold text-lg text-black">{cityName}</h3>
        <Badge variant="outline" className="ml-2">
          <Users className="w-3 h-3 mr-1" />
          {artists.length}
        </Badge>
      </div>

      <div className="space-y-2 p-3">
        {artists.map((artist) => (
          <div
            key={artist.uuid}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => setSelectedArtist(artist)}
          >
            <div className="flex items-center space-x-2">
              {artist.artist_image && (
                <Image
                  src={artist.artist_image}
                  alt={artist.artist_name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium text-sm text-black">{artist.artist_name}</p>
                {artist.artist_genre && (
                  <p className="text-xs text-gray-500">{artist.artist_genre}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
              View →
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GrooverMap() {
  const [artists, setArtists] = useState<ArtistWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarkerData[]>([]);

  useEffect(() => {
    async function loadArtists() {
      try {
        setLoading(true);
        setError(null);
        const data = await artistService.getGrooverArtistsWithLocations();
        setArtists(data);

        const markerMap = new Map<string, MapMarkerData>();
        
        data.forEach((artist) => {
          if (artist.city && artist.city.latitude && artist.city.longitude) {
            const key = `${artist.city.latitude},${artist.city.longitude}`;
            
            const existingMarker = markerMap.get(key);
            if (existingMarker) {
              existingMarker.artists.push(artist);
            } else {
              markerMap.set(key, {
                position: [artist.city.latitude, artist.city.longitude],
                artists: [artist],
                cityName: artist.city.name || artist.artist_home || "Unknown City"
              });
            }
          }
        });

        setMapMarkers(Array.from(markerMap.values()));
      } catch (err) {
        console.error("Error loading Groover artists:", err);
        setError("Failed to load artist locations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadArtists();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Groover artists worldwide...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card className="w-full bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No Groover artists with location data found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <MapPin className="w-6 h-6 mr-2 text-blue-400" />
            Groover Artists Worldwide
          </CardTitle>
          <p className="text-sm text-gray-400">
            Discover {artists.length} Groover artists from {mapMarkers.length} cities around the globe
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {mapMarkers.map((marker, index) => (
                <Marker key={index} position={marker.position}>
                  <Popup maxWidth={350} className="custom-popup">
                    <ArtistPopup 
                      artists={marker.artists} 
                      cityName={marker.cityName}
                    />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Users className="w-5 h-5 mr-2" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="text-lg sm:text-2xl font-bold text-blue-400">{artists.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Artists</div>
            </div>
            <div className="text-center p-2 sm:p-4 bg-green-900/20 rounded-lg border border-green-800/30">
              <div className="text-lg sm:text-2xl font-bold text-green-400">{mapMarkers.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Cities</div>
            </div>
            <div className="text-center p-2 sm:p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <div className="text-lg sm:text-2xl font-bold text-purple-400">
                {new Set(artists.map(a => a.artist_genre).filter(Boolean)).size}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Genres</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}