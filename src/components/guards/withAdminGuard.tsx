import { ComponentType, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUserProfile } from "@/contexts/UserProfileContext";
import StaffAuthDialog from "@/components/StaffAuthDialog";

/**
 * HOC to protect admin-only pages and components.
 * Shows auth dialog for non-authenticated users and redirects non-admin users to home.
 * 
 * Usage: export default withAdminGuard(MyAdminPage);
 */
export function withAdminGuard<P extends object>(WrappedComponent: ComponentType<P>) {
    const ComponentWithAdminGuard = (props: P) => {
        const router = useRouter();
        const { user, role, loading } = useUserProfile();
        const [showAuthDialog, setShowAuthDialog] = useState(false);

        useEffect(() => {
            // Wait for auth and profile to load
            if (loading) return;

            // Show auth dialog if not authenticated
            if (!user) {
                console.log("🔐 [AdminGuard] No authenticated user - showing auth dialog");
                setShowAuthDialog(true);
                return;
            }

            // Redirect to home if authenticated but not admin
            if (role !== "otwstaff") {
                console.log(`🚫 [AdminGuard] User role '${role}' is not admin - redirecting to home`);
                router.replace("/");
                return;
            }

            console.log("✅ [AdminGuard] Admin access granted");
            setShowAuthDialog(false);
        }, [user, role, loading, router]);

        // Show loading spinner while checking auth
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
                    <div className="text-center text-white space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                        <div className="text-lg">Verifying admin access...</div>
                    </div>
                </div>
            );
        }

        // Show auth dialog if not authenticated
        if (!user) {
            return (
                <>
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
                        <div className="text-center text-white space-y-6 max-w-md px-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Staff Access Required</h1>
                                <p className="text-blue-200">Please sign in with your OTW staff credentials to access this page.</p>
                            </div>
                        </div>
                    </div>
                    <StaffAuthDialog 
                        isOpen={showAuthDialog} 
                        onClose={() => router.push("/")}
                    />
                </>
            );
        }

        // Don't render anything while redirecting non-admin users
        if (role !== "otwstaff") {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    ComponentWithAdminGuard.displayName = `withAdminGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return ComponentWithAdminGuard;
}