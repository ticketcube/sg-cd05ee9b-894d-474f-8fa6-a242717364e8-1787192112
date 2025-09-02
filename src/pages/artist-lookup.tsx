"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ArtistProfileLookup from "@/components/ArtistProfileLookup";
import ChartmetricLookup from "@/components/ChartmetricLookup";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ArtistLookupPage() {
    const [active, setActive] = useState < boolean | null > (null);

    useEffect(() => {
        const checkModule = async () => {
            const { data, error } = await supabase
                .from("staff_modules")
                .select("is_active")
                .eq("slug", "artist-lookup")
                .single();

            if (error) {
                console.error("Failed to check module", error);
                setActive(false);
            } else {
                setActive(data?.is_active ?? false);
            }
        };

        checkModule();
    }, []);

    // Loading state
    if (active === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <p className="text-gray-300 text-lg">Loading…</p>
            </div>
        );
    }

    // Module disabled
    if (!active) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <p className="text-red-500 text-lg">🚫 This module is disabled.</p>
            </div>
        );
    }

    // Active module
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ArtistProfileLookup />
                <ChartmetricLookup />
            </div>
        </div>
    );
}
