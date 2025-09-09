export interface Artist {
    id: number;
    name: string;
    tiktok_handle: string;
    instagram_handle?: string | null;
    spotify_artist_id?: string | null;
    created_at: string;
    profile_picture_url?: string | null;
    youtubemusic_handle?: string | null;
    youtube_handle?: string | null;
    agency?: string | null;
    manager?: string | null;
    manager_email?: string | null;
    agent?: string | null;
    agent_email?: string | null;
    label?: string | null;
    publisher?: string | null;
    territory?: string | null;
    uuid: string;
}

export interface ArtistWithVotes extends Artist {
    votes_count: number;
}

export interface ArtistEvent {
    id: string;
    name: string;
    url: string;
    city: string;
    venue: string;
    date: string;
}

export interface ArtistSocialLink {
    url: string;
    platform: 'spotify' | 'instagram' | 'tiktok' | 'youtube' | 'soundcloud';
}