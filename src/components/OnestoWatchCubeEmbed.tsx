import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface OnestoWatchCubeEmbedProps {
    artistId: string;
    artistName: string;
    artistImage?: string;
    referralSource?: string;
    compact?: boolean;
}

/**
 * Embeds the interactive 3D TicketCube from TicketCube.io
 * Displays the actual rotating cube with a claim button below
 * Automatically updates when artistId/artistName props change
 */
export function OnestoWatchCubeEmbed({
    artistId,
    artistName,
    referralSource = "onestowatch",
    compact = false
}: OnestoWatchCubeEmbedProps) {
    // Build the iframe src URL for the 3D cube
    const cubeEmbedUrl = `https://ticketcube.io/embed/cube?artist=${encodeURIComponent(artistId)}&name=${encodeURIComponent(artistName)}`;
    
    // Build the claim URL
    const claimUrl = `https://ticketcube.io/claim/onestowatch?artist=${encodeURIComponent(artistId)}&name=${encodeURIComponent(artistName)}&ref=${referralSource}`;

    const handleClaimClick = () => {
        window.open(claimUrl, "_blank", "noopener,noreferrer");
    };

    if (compact) {
        return (
            <div className="inline-flex items-center gap-3 bg-black/5 px-4 py-3 rounded-lg border border-black/10">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-black">
                        {artistName} TicketCube™
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={handleClaimClick}
                    className="bg-black hover:bg-black/90 text-white shrink-0"
                >
                    Claim
                    <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Artist Info Header */}
            <div className="text-center py-4 px-4">
                <h3 className="text-xl font-bold text-black mb-1">
                    {artistName}
                </h3>
              
            </div>

            {/* 3D Cube Embed - 1:1 aspect ratio */}
            <div className="relative w-full" style={{ paddingTop: '100%' }}>
                <iframe 
                    key={`cube-${artistId}`}
                    src={cubeEmbedUrl}
                    allow="autoplay"
                    loading="eager"
                    title={`${artistName} TicketCube`}
                    className="absolute top-0 left-0 w-full h-full border-none rounded-lg bg-black"
                />
            </div>

            {/* Claim Button */}
            <div className="p-4">
                <Button
                    size="lg"
                    onClick={handleClaimClick}
                    className="w-full bg-black hover:bg-black/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    Claim Your TicketCube
                    <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}