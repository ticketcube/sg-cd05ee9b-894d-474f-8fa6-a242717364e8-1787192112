
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Music } from "lucide-react";
import { artistService } from "@/services/artistService";
import type { ArtistWithLocation, MapMarkerData } from "@/types/map";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const MarkerClusterGroup = dynamic(
  () => import("react-leaflet").then(async (mod) => {
    const L = await import("leaflet");
    await import("leaflet.markercluster");
    return mod.MarkerClusterGroup;
  }),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface ArtistPopupProps {
  artists: ArtistWithLocation[];
  cityName: string;
}

function ArtistPopup({ artists, cityName }: ArtistPopupProps) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithLocation | null>(null);

  if (selectedArtist) {
    return (
      <div className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedArtist(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to {cityName}
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {selectedArtist.artist_image && (
              <img
                src={selectedArtist.artist_image}
                alt={selectedArtist.artist_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-bold text-lg">{selectedArtist.artist_name}</h3>
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
                onClick={() => window.open(selectedArtist.artist_videolink!, "_blank")}
                className="bg-red-600 hover:bg-red-700"
              >
                <Music className="w-4 h-4 mr-1" />
                Video
              </Button>
            )}
            {selectedArtist.artist_audiolink && (
              <Button
                size="sm"
                onClick={() => window.open(selectedArtist.artist_audiolink!, "_blank")}
                className="bg-green-600 hover:bg-green-700"
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
    <div className="w-72 max-h-80 overflow-y-auto">
      <div className="flex items-center mb-3">
        <MapPin className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-bold text-lg">{cityName}</h3>
        <Badge variant="outline" className="ml-2">
          <Users className="w-3 h-3 mr-1" />
          {artists.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {artists.map((artist) => (
          <div
            key={artist.uuid}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => setSelectedArtist(artist)}
          >
            <div className="flex items-center space-x-2">
              {artist.artist_image && (
                <img
                  src={artist.artist_image}
                  alt={artist.artist_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium text-sm">{artist.artist_name}</p>
                {artist.artist_genre && (
                  <p className="text-xs text-gray-500">{artist.artist_genre}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600">
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
            
            if (markerMap.has(key)) {
              markerMap.get(key)!.artists.push(artist);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Groover artists worldwide...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (artists.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No Groover artists with location data found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-blue-600" />
            Groover Artists Worldwide
          </CardTitle>
          <p className="text-sm text-gray-600">
            Discover {artists.length} Groover artists from {mapMarkers.length} cities around the globe
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 w-full relative">
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
              
              <MarkerClusterGroup>
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
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{artists.length}</div>
              <div className="text-sm text-gray-600">Total Artists</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{mapMarkers.length}</div>
              <div className="text-sm text-gray-600">Cities</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(artists.map(a => a.artist_genre).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Genres</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
