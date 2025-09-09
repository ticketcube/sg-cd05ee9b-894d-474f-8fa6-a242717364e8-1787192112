import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { artistService } from '@/services/artistService';
import { Artist, VibeArtist } from '@/types/artists';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function VibePage() {
    const router = useRouter();
    const { vibe } = router.query;
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof vibe === 'string') {
            setLoading(true);
            artistService.getArtistsByVibe(vibe)
                .then(data => {
                    setArtists(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch artists by vibe", err);
                    setLoading(false);
                });
        }
    }, [vibe]);

    const getVibeSpecifics = (artist: Artist): string => {
        const specifics = [];
        if (artist.primary_vibe) specifics.push(`Primary Vibe: ${artist.primary_vibe}`);
        if (artist.secondary_vibe) specifics.push(`Secondary Vibe: ${artist.secondary_vibe}`);
        return specifics.join(' | ');
    };

    if (loading) return <div>Loading artists for vibe: {vibe}...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Artists with the Vibe: <span className="text-blue-500">{vibe}</span></h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artists.map(artist => (
                    <Card key={artist.uuid} className="overflow-hidden">
                        <Link href={`/artist/${artist.uuid}`}>
                            <div className="block">
                                <Image src={artist.profile_picture_url || '/OTWLogocolor.png'} alt={artist.name} width={400} height={400} className="w-full h-48 object-cover" />
                                <div className="p-4">
                                    <h2 className="font-bold text-lg">{artist.name}</h2>
                                    <p className="text-sm text-gray-500">{getVibeSpecifics(artist)}</p>
                                    <Button className="mt-4 w-full">View Profile</Button>
                                </div>
                            </div>
                        </Link>
                    </Card>
                ))}
            </div>
            {artists.length === 0 && !loading && (
                <div className="text-center py-10">
                    <p>No artists found for this vibe yet.</p>
                </div>
            )}
        </div>
    );
}
