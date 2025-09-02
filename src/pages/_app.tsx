import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";


import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";

// ✅ PostHog
import { initPosthog } from "@/lib/posthog";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const supabase = createBrowserSupabaseClient();

    useEffect(() => {
        initPosthog();
    }, []);

    return (
        <SessionContextProvider supabaseClient={supabase}>
            <AppLayout>
                <Component {...pageProps} />
            </AppLayout>
            <Toaster />
        </SessionContextProvider>
    );
}