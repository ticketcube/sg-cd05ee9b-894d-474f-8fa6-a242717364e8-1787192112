import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Box, Calendar, Eye, Lock, Unlock, Gift, RefreshCw, Coins } from "lucide-react";
import { ticketCubeService } from "@/services/ticketCubeService";
import type { TicketCube } from "@/services/ticketCubeService";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { DynamicCube } from "@/components/3d/DynamicCube";
import { useCube } from "@/contexts/CubeContext";

const TierBadge = ({ tier }: { tier: string }) => {
    const getBadgeVariant = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'free': return 'secondary';
            case 'pro': return 'default';
            case 'collector': return 'destructive';
            default: return 'secondary';
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'free': return <Lock className="w-3 h-3" />;
            case 'pro': return <RefreshCw className="w-3 h-3" />;
            case 'collector': return <Coins className="w-3 h-3" />;
            default: return <Lock className="w-3 h-3" />;
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'free': return 'bg-gray-600 text-gray-100';
            case 'pro': return 'bg-blue-600 text-white';
            case 'collector': return 'bg-purple-600 text-white';
            default: return 'bg-gray-600 text-gray-100';
        }
    };

    return (
        <Badge className={`${getTierColor(tier)} flex items-center gap-1`}>
            {getTierIcon(tier)}
            {tier.toUpperCase()}
        </Badge>
    );
};

const CubePreview = ({ cube }: { cube: TicketCube }) => {
    const { setCubeData } = useCube();
    const [cubeFaces, setCubeFaces] = useState < any[] > ([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadCubeFaces = async () => {
            try {
                setIsLoading(true);
                // Load the actual cube faces from the database
                const cubeResult = await ticketCubeService.getTicketCube(cube.id);

                if (cubeResult) {
                    const { faces } = cubeResult;

                    // Convert database faces to cube context format
                    const cubeFaceData = faces.map(face => ({
                        id: face.id,
                        number: face.face_number,
                        title: face.face_title || `Face ${face.face_number}`,
                        contentType: face.content_type,
                        text: face.content_text,
                        image: {
                            url: face.image_url,
                            preview: face.image_url // Use stored image URL as preview
                        }
                    }));

                    // Fill missing faces with default data up to 6 faces
                    const allFaces = [];
                    for (let i = 1; i <= 6; i++) {
                        const existingFace = cubeFaceData.find(f => f.number === i);
                        if (existingFace) {
                            allFaces.push(existingFace);
                        } else {
                            // Default face data if not found
                            allFaces.push({
                                id: `default-${i}`,
                                number: i,
                                contentType: 'text' as const,
                                text: i === 6 ? 'TicketCube™' : `Face ${i}`,
                                image: { preview: null },
                                title: i === 6 ? 'TicketCube™' : `Face ${i}`
                            });
                        }
                    }

                    setCubeFaces(allFaces);

                    // Set cube data for 3D preview with actual stored data
                    setCubeData({
                        type: 'standard',
                        title: cube.title,
                        description: cube.description,
                        faces: allFaces
                    });
                }
            } catch (error) {
                console.error('Error loading cube faces:', error);
                // Fallback to basic preview data
                const fallbackFaces = [
                    { id: '1', number: 1, contentType: 'text' as const, image: { preview: null }, title: cube.title || 'Face 1', text: cube.title },
                    { id: '2', number: 2, contentType: 'text' as const, image: { preview: null }, title: cube.description || 'Face 2', text: cube.description },
                    { id: '3', number: 3, contentType: 'text' as const, image: { preview: null }, title: cube.event_name || 'Face 3', text: cube.event_name },
                    { id: '4', number: 4, contentType: 'text' as const, image: { preview: null }, title: cube.venue || 'Face 4', text: cube.venue },
                    { id: '5', number: 5, contentType: 'text' as const, image: { preview: null }, title: cube.event_date || 'Face 5', text: cube.event_date },
                    { id: '6', number: 6, contentType: 'text' as const, image: { preview: null }, title: 'TicketCube™', text: 'TicketCube™' }
                ];

                setCubeData({
                    type: 'standard',
                    title: cube.title,
                    description: cube.description,
                    faces: fallbackFaces
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadCubeFaces();
    }, [cube, setCubeData]);

    if (isLoading) {
        return (
            <div className="w-full h-full mx-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full mx-auto">
            <Canvas camera={{ position: [0, 0, 2], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <DynamicCube />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default function MyCubesPage() {
    const { user } = useAuth();
    const [cubes, setCubes] = useState < TicketCube[] > ([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState < string | null > (null);

    useEffect(() => {
        if (user) {
            loadUserCubes();
        }
    }, [user]);

    const loadUserCubes = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const result = await ticketCubeService.getUserTicketCubes(user.auth_id);
            setCubes(result.cubes); // Extract cubes array from the result object

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load cubes";
            console.error("Error loading cubes:", errorMessage, err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTierFeatures = (tier: string, updatesRemaining?: number, giftsRemaining?: number) => {
        switch (tier.toLowerCase()) {
            case 'free':
                return ['Secured cube', 'No updates allowed', 'No gift copies'];
            case 'pro':
                return [
                    'Secured cube',
                    `${updatesRemaining || 0} updates remaining`,
                    `${giftsRemaining || 0} gift copies remaining`
                ];
            case 'collector':
                return [
                    'Secured cube',
                    'Unlimited updates',
                    `${giftsRemaining || 0} gift copies remaining`,
                    'Minted as TCUBE'
                ];
            default:
                return ['Unknown tier'];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <Box className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                    <h1 className="text-2xl font-bold mb-4">Loading Your TicketCubes...</h1>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Error Loading Cubes</h1>
                    <p className="text-xl mb-4">{error}</p>
                    <Button onClick={loadUserCubes} className="bg-blue-600 hover:bg-blue-700">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = "/"}
                                className="text-white hover:bg-gray-800 flex-shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-xl font-bold text-blue-500">
                                My TicketCubes™
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="p-4 max-w-4xl mx-auto">
                    {cubes.length === 0 ? (
                        <div className="text-center py-16">
                            <Box className="w-20 h-20 mx-auto mb-6 text-gray-600" />
                            <h2 className="text-2xl font-bold mb-4">No TicketCubes Yet</h2>
                            <p className="text-gray-400 mb-6">
                                Create your first TicketCube to preserve your concert memories!
                            </p>
                            <Button
                                onClick={() => window.location.href = "/ticketcube"}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Create Your First Cube
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Header Stats */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">
                                    Your TicketCube Collection ({cubes.length})
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <Card className="bg-gray-900 border-gray-700">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-green-500">
                                                {cubes.filter(cube => cube.is_secured).length}
                                            </div>
                                            <div className="text-sm text-gray-400">Secured Cubes</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gray-900 border-gray-700">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-500">
                                                {cubes.filter(cube => cube.tier === 'pro').length}
                                            </div>
                                            <div className="text-sm text-gray-400">Pro Cubes</div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gray-900 border-gray-700">
                                        <CardContent className="p-4 text-center">
                                            <div className="text-2xl font-bold text-purple-500">
                                                {cubes.filter(cube => cube.tier === 'collector').length}
                                            </div>
                                            <div className="text-sm text-gray-400">Collector Cubes</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                                {/* Cubes Grid - Mobile Friendly */}
                                <div className="space-y-6">
                                    {cubes.map((cube) => (
                                        <Card key={cube.id} className="bg-gray-900 border-gray-700">
                                            <CardHeader className="pb-3">
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-stretch">

                                                    {/* Left Column - Cube Details */}
                                                    <div className="flex flex-col justify-between space-y-4">
                                                        {/* Title */}
                                                        <CardTitle className="text-lg font-bold text-white">
                                                            {cube.title}
                                                        </CardTitle>

                                                        {/* Tier + Status */}
                                                        <div className="flex items-center gap-2">
                                                            <TierBadge tier={cube.tier || "free"} />
                                                            {cube.is_secured ? (
                                                                <Badge className="bg-green-600 text-white">
                                                                    <Lock className="w-3 h-3 mr-1" />
                                                                    Secured
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">
                                                                    <Unlock className="w-3 h-3 mr-1" />
                                                                    Draft
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Event */}
                                                        <div>
                                                            <div className="text-sm text-gray-400">Event</div>
                                                            <div className="text-white font-medium">
                                                                {cube.event_name || "No event specified"}
                                                            </div>
                                                        </div>

                                                        {/* Venue */}
                                                        <div>
                                                            <div className="text-sm text-gray-400">Venue</div>
                                                            <div className="text-white font-medium">
                                                                {cube.venue || "No venue specified"}
                                                            </div>
                                                        </div>

                                                        {/* Date */}
                                                        <div>
                                                            <div className="text-sm text-gray-400">Date</div>
                                                            <div className="text-white font-medium flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(cube.event_date)}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="mt-auto">
                                                            <Button variant="secondary" className="w-full">
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Right Column - Cube Preview */}
                                                    <div className="relative w-full h-full aspect-square">
                                                        <CubePreview cube={cube} />
                                                    </div>
                                                </div>
                                            </CardHeader>



                                            <CardContent>
                                                {/* Description */}
                                                {cube.description && (
                                                    <div className="mb-4">
                                                        <div className="text-sm text-gray-400 mb-1">Description</div>
                                                        <div className="text-gray-300 text-sm">{cube.description}</div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                                                        onClick={() => (window.location.href = `/ticketcube?edit=${cube.id}`)}>
                                                        <Eye className="w-4 h-4 mr-1" /> View
                                                    </Button>
                                                    {!cube.is_secured && (
                                                        <Button size="sm" variant="outline"
                                                            onClick={() => (window.location.href = `/ticketcube?edit=${cube.id}`)}>
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {cube.gifts_remaining && cube.gifts_remaining > 0 && (
                                                        <Button size="sm" variant="outline" disabled>
                                                            <Gift className="w-4 h-4 mr-1" /> Gift Copy
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>


                            {/* Create New Button */}
                            <div className="mt-8 text-center">
                                <Button
                                    onClick={() => window.location.href = "/ticketcube"}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Box className="w-4 h-4 mr-2" />
                                    Create New TicketCube
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}