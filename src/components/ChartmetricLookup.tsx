'use client'; // This is a Client Component

import { useState } from 'react';

interface ChartmetricArtist {
  name: string;
  id: string;
  sp_followers?: number;
  image_url?: string;
}

export default function ChartmetricLookup() {
  const [artistName, setArtistName] = useState('');
  const [result, setResult] = useState<ChartmetricArtist | null>(null);
  const [error, setError] = useState('');

  const lookup = async () => {
    setError(''); setResult(null);
    if (!artistName.trim()) {
      setError('Enter an artist name');
      return;
    }

    try {
      const res = await fetch(`/api/chartmetric?artist=${encodeURIComponent(artistName)}`);
      const json = await res.json();
      if (res.ok && json.artist) {
        setResult(json.artist);
      } else {
        setError(json.error || 'Artist not found');
      }
    } catch (err) {
      setError('Fetch error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '1rem auto', padding: '1rem', border: '1px solid #ccc' }}>
      <h3>Chartmetric Artist Lookup</h3>
      <input
        type="text"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        placeholder="Enter artist name"
        style={{ width: '100%', padding: '0.5rem' }}
      />
      <button onClick={lookup} style={{ marginTop: '0.5rem' }}>
        Search
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p><strong>Name:</strong> {result.name}</p>
          <p><strong>ID:</strong> {result.id}</p>
          {result.sp_followers && <p><strong>Spotify followers:</strong> {result.sp_followers}</p>}
          {result.image_url && <img src={result.image_url} alt={result.name} style={{ width: '50%' }} />}
        </div>
      )}
    </div>
  );
}
