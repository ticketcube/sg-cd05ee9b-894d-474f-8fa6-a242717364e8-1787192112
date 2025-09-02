import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ArtistProfileLookup from "@/components/ArtistProfileLookup";
import ChartmetricLookup from "@/components/ChartmetricLookup";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ArtistLookupPage() {
  const [active, setActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkModule = async () => {
      const { data, error } = await supabase
        .from("otw_modules")
        .select("is_active")
        .eq("key", "artist_lookup")
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

  if (active === null) return <p>Loading…</p>;
  if (!active) return <p>🚫 This module is disabled.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <ArtistProfileLookup />
      <ChartmetricLookup />
    </div>
  );
}
