
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";

interface OnestoWatchCubeEmbedProps {
    artistId: string;
    artistName: string;
    artistImage?: string;
    cubeId?: string;
    referralSource?: string;
    compact?: boolean;
}

/**
 * Lightweight embeddable component for OnesToWatch integration
 * Shows a static preview of the artist's TicketCube with a claim CTA
 * Links to TicketCube for full interactive experience
 */
export function OnestoWatchCubeEmbed({
    artistId,
    artistName,
    artistImage,
    cubeId,
    referralSource = "onestowatch",
    compact = false
}: OnestoWatchCubeEmbedProps) {
    const [imageError, setImageError] = useState(false);

    const claimUrl = `/claim/onestowatch?artist=${encodeURIComponent(artistId)}&name=${encodeURIComponent(artistName)}&ref=${referralSource}${cubeId ? `&cube=${cubeId}` : ""}`;

    const handleClaimClick = () => {
        window.open(`https://ticketcube.io${claimUrl}`, "_blank", "noopener,noreferrer");
    };

    if (compact) {
        return (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-800">
                {artistImage && !imageError && (
                    <img
                        src={artistImage}
                        alt={artistName}
                        className="w-10 h-10 rounded-md object-cover"
                        onError={() => setImageError(true)}
                    />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                        Claim {artistName} TicketCube™
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={handleClaimClick}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shrink-0"
                >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Claim
                </Button>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">

                    {artistImage && !imageError && (
                        <div className="relative w-full aspect-square max-w-[200px] rounded-lg overflow-hidden border-4 border-purple-300 dark:border-purple-700 shadow-lg">
                            <img
                                src={artistImage}
                                alt={artistName}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {artistName} TicketCube™
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Claim your free interactive 3D collectible cube and unlock exclusive content
                        </p>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleClaimClick}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Claim Free TicketCube
                        <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            Free
                        </span>
                        <span>·</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            Interactive 3D
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
