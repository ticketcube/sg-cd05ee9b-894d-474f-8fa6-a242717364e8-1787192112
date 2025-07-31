
export interface CityLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ArtistWithLocation {
  uuid: string;
  artist_name: string;
  artist_home: string | null;
  artist_image: string | null;
  artist_genre: string | null;
  artist_bio: string | null;
  artist_videolink: string | null;
  artist_audiolink: string | null;
  cityid: number | null;
  city?: CityLocation;
}

export interface MapMarkerData {
  position: [number, number];
  artists: ArtistWithLocation[];
  cityName: string;
}
