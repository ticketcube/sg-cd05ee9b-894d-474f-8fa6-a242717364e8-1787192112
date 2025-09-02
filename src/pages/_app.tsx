import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

// DEPRECATED: Keep during migration period for components not yet updated
import AuthProvider from "@/contexts/AuthContext";

import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";

// ✅ PostHog
import { initPosthog } from "@/lib/posthog";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    // Create a singleton Supabase client instance
    const [supabase] = useState(() => createBrowserSupabaseClient());

    useEffect(() => {
        initPosthog();
    }, []);

    return (
        <SessionContextProvider supabaseClient={supabase}>
            <UserProfileProvider>
                {/* MIGRATION NOTICE: AuthProvider is deprecated but kept for backward compatibility */}
                <AuthProvider>
                    <AppLayout>
                        <Component {...pageProps} />
                    </AppLayout>
                    <Toaster />
                </AuthProvider>
            </UserProfileProvider>
        </SessionContextProvider>
    );
}