import { ComponentType, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * HOC to protect admin-only pages and components.
 * Redirects non-authenticated users to login and non-admin users to home.
 * 
 * Usage: export default withAdminGuard(MyAdminPage);
 */
export function withAdminGuard<P extends object>(WrappedComponent: ComponentType<P>) {
    const ComponentWithAdminGuard = (props: P) => {
        const router = useRouter();
        const user = useUser();
        const { role, loading } = useUserProfile();

        useEffect(() => {
            // Wait for auth and profile to load
            if (loading) return;

            // Redirect to home if not authenticated
            if (!user) {
                console.log("🚫 [AdminGuard] No authenticated user - redirecting to home");
                router.replace("/");
                return;
            }

            // Redirect to home if not admin
            if (role !== "otwstaff") {
                console.log(`🚫 [AdminGuard] User role '${role}' is not admin - redirecting to home`);
                router.replace("/");
                return;
            }

            console.log("✅ [AdminGuard] Admin access granted");
        }, [user, role, loading, router]);

        // Show loading spinner while checking auth
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="text-center text-white">
                        <div className="animate-pulse text-lg">Verifying admin access...</div>
                    </div>
                </div>
            );
        }

        // Don't render anything while redirecting
        if (!user || role !== "otwstaff") {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    ComponentWithAdminGuard.displayName = `withAdminGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return ComponentWithAdminGuard;
}