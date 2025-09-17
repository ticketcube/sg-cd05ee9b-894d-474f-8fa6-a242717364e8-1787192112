import { useEffect, useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import StaffModuleCard from "./StaffModuleCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2 } from "lucide-react";

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
  const { user, profile, role, loading: profileLoading } = useUserProfile();
  const [modules, setModules] = useState<StaffModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only fetch modules if user is authenticated and has staff role
  useEffect(() => {
    const fetchModules = async () => {
      // Wait for auth and profile to be resolved
      if (profileLoading || !user) {
        setLoading(profileLoading);
        return;
      }

      // Check if user has staff role
      if (role !== "otwstaff") {
        setError("Access denied: Staff privileges required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("staff_modules")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (fetchError) {
          console.error("Error fetching staff modules:", fetchError.message);
          setError(`Failed to load staff modules: ${fetchError.message}`);
          return;
        }

        setModules(data || []);
      } catch (err) {
        console.error("Unexpected error fetching staff modules:", err);
        setError("An unexpected error occurred while loading staff modules");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user, role, profileLoading]);

  // Show loading state
  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading staff portal...</p>
        </div>
      </div>
    );
  }

  // Show access denied message
  if (!user || role !== "otwstaff") {
    return (
      <div className="py-12">
        <Alert className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. This section is restricted to OTW Staff members only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render staff portal
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">OTW Staff Portal</h2>
          <p className="text-gray-300 text-sm">
            Welcome, {profile?.username || user.email} • Staff-only tools and dashboards
          </p>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No staff modules are currently available.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <StaffModuleCard key={module.id} {...module} />
          ))}
        </div>
      )}
    </div>
  );
}