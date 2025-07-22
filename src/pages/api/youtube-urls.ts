
import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = process.env.YOUTUBE_API_KEY;

interface ArtistResult {
  artist: string;
  url: string | null;
  error?: string;
}

async function getChannelForArtist(artistName: string) {
  const query = `${artistName} official channel`;
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(query)}&key=${API_KEY}`);
  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  return data.items?.[0]?.snippet ? {
    title: data.items[0].snippet.title,
    channelId: data.items[0].snippet.channelId,
    channelUrl: `https://www.youtube.com/channel/${data.items[0].snippet.channelId}`
  } : null;
}

async function getMostPopularVideo(channelId: string) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=1&key=${API_KEY}`);
  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }
  
  const video = data.items?.[0];
  return video ? `https://www.youtube.com/watch?v=${video.id.videoId}` : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  const { artists } = req.body;

  if (!artists || !Array.isArray(artists)) {
    return res.status(400).json({ error: 'Artists array is required' });
  }

  const results: ArtistResult[] = [];

  for (const artist of artists) {
    try {
      const channel = await getChannelForArtist(artist.trim());
      
      if (channel) {
        const videoUrl = await getMostPopularVideo(channel.channelId);
        results.push({
          artist: artist.trim(),
          url: videoUrl
        });
      } else {
        results.push({
          artist: artist.trim(),
          url: null
        });
      }
    } catch (error) {
      results.push({
        artist: artist.trim(),
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.status(200).json({ results });
}
