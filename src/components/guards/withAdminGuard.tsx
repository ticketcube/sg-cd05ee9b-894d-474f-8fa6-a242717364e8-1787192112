import { ComponentType, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function withAdminGuard<P>(WrappedComponent: ComponentType<P>) {
    const ComponentWithAdminGuard = (props: P) => {
        const router = useRouter();
        const user = useUser();
        const { role, loading } = useUserProfile();

        useEffect(() => {
            if (loading) return;

            if (!user) {
                router.replace("/login");
                return;
            }

            if (role !== "otwstaff") {
                router.replace("/");
            }
        }, [user, role, loading, router]);

        if (loading) {
            return <p className="p-4 text-center">Loading...</p>;
        }

        if (!user || role !== "otwstaff") {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return ComponentWithAdminGuard;
}
