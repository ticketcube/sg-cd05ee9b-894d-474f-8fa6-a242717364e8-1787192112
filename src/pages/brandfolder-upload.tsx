import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, AlertCircle, Upload, X } from "lucide-react";
import { useRouter } from "next/router";
import AuthGuard from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ArtistSubmissionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef < HTMLInputElement > (null);

    // Form fields
    const [artistName, setArtistName] = useState("");
    const [artistVideo, setArtistVideo] = useState("");
    const [artistHome, setArtistHome] = useState("");
    const [artistGenre, setArtistGenre] = useState("");
    const [weeklyListId, setWeeklyListId] = useState("");

    // Image upload
    const [selectedFile, setSelectedFile] = useState < File | null > (null);
    const [previewUrl, setPreviewUrl] = useState < string | null > (null);

    // State
    const [loading, setLoading] = useState(false);
    const [artistUUID, setArtistUUID] = useState < string | null > (null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const resetFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!user) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to submit artists.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedFile) {
            setErrorMessage("Please upload an artist image.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setArtistUUID(null);

        try {
            // Step 1: Upload image to Supabase Storage
            const rawFileName = `${Date.now()}_${selectedFile.name}`;
            const filePath = `artists/${encodeURIComponent(rawFileName)}`;
            const { error: uploadError } = await supabase.storage
                .from("artistscontent") // your bucket name
                .upload(filePath, selectedFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Step 2: Get public URL for the image
            const {
                data: { publicUrl },
            } = supabase.storage.from("artistscontent").getPublicUrl(filePath);

            // Step 3: Call the RPC function
            const { data, error } = await supabase.rpc(
                "upsert_artist_and_add_to_weekly_list",
                {
                    p_artist_name: artistName,
                    p_artist_videolink: artistVideo,
                    p_artist_image: publicUrl, // use Supabase URL
                    p_artist_home: artistHome,
                    p_artist_genre: artistGenre,
                    p_weekly_list_id: parseInt(weeklyListId, 10),
                }
            );

            if (error) throw error;

            setArtistUUID(data);
            toast({
                title: "Success!",
                description: "Artist saved successfully.",
            });
        } catch (err: any) {
            console.error("Submit error:", err);
            setErrorMessage(err.message || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-black text-white">
                {/* Header */}
                <div className="sticky top-0 bg-black z-10 p-4 border-b border-gray-800">
                    <div className="max-w-md mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/")}
                                className="text-white hover:bg-gray-800"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <h1 className="text-xl font-bold text-blue-500 truncate">
                                Submit an Artist
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="max-w-md mx-auto">
                        <Card className="bg-gray-900 border-gray-700">
                            <CardContent className="p-6 space-y-6">
                                {/* User Info */}
                                <div className="text-center">
                                    <p className="text-sm text-gray-400">Submitting as</p>
                                    <p className="text-lg font-semibold text-white">
                                        {user?.username}
                                    </p>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <Input
                                        value={artistName}
                                        onChange={(e) => setArtistName(e.target.value)}
                                        placeholder="Artist Name"
                                        className="bg-gray-800 border-gray-600 text-white"
                                    />
                                    <Input
                                        value={artistVideo}
                                        onChange={(e) => setArtistVideo(e.target.value)}
                                        placeholder="Video URL"
                                        className="bg-gray-800 border-gray-600 text-white"
                                    />
                                    <Input
                                        value={artistHome}
                                        onChange={(e) => setArtistHome(e.target.value)}
                                        placeholder="Artist Hometown"
                                        className="bg-gray-800 border-gray-600 text-white"
                                    />
                                    <Input
                                        value={artistGenre}
                                        onChange={(e) => setArtistGenre(e.target.value)}
                                        placeholder="Genre"
                                        className="bg-gray-800 border-gray-600 text-white"
                                    />
                                    <Input
                                        value={weeklyListId}
                                        onChange={(e) => setWeeklyListId(e.target.value)}
                                        placeholder="Weekly List ID"
                                        type="number"
                                        className="bg-gray-800 border-gray-600 text-white"
                                    />

                                    {/* Image Upload */}
                                    {!selectedFile ? (
                                        <div
                                            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                            <p className="text-gray-400 text-sm">Upload Artist Image</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <img
                                                src={previewUrl!}
                                                alt="Artist Preview"
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={resetFile}
                                                className="absolute top-2 right-2 bg-gray-700 rounded-full p-1 hover:bg-gray-600"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-400">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Success */}
                                {artistUUID && (
                                    <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <p className="text-sm text-green-400">
                                            Artist saved! UUID: {artistUUID}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-lg py-3"
                                    size="lg"
                                >
                                    {loading ? "Saving..." : "Submit Artist"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
