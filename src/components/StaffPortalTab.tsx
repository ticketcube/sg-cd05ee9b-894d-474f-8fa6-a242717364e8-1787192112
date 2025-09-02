"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import StaffModuleCard from "./StaffModuleCard";

interface StaffModule {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sort_order: number;
}

export default function StaffPortalTab() {
    const [modules, setModules] = useState < StaffModule[] > ([]);

    useEffect(() => {
        const fetchModules = async () => {
            const { data, error } = await supabase
                .from("staff_modules")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (error) {
                console.error("Error fetching staff modules:", error.message);
                return;
            }
            setModules(data || []);
        };

        fetchModules();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">OTW Staff</h2>
            <p className="text-gray-300 text-lg">
                Staff-only tools and dashboards
            </p>

            <div className="grid gap-6 md:grid-cols-2">
                {modules.map((m) => (
                    <StaffModuleCard key={m.id} {...m} />
                ))}
            </div>
        </div>
    );
}
