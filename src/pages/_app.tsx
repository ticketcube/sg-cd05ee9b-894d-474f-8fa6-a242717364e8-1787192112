import React from "react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";
import type { Database } from "@/integrations/supabase/types";

// PostHog
import { initPosthog } from "@/lib/posthog";

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    
    // ✅ FIXED: Create client with consistent naming
    const [supabaseClient] = useState(() => createPagesBrowserClient<Database>());

    useEffect(() => {
        initPosthog();
    }, []);

    return (
        <SessionContextProvider 
            supabaseClient={supabaseClient}  {/* ✅ FIXED: Use consistent variable name */}
            initialSession={pageProps.initialSession}
        >
            <UserProfileProvider>
                <AppLayout>
                    <Component {...pageProps} />
                </AppLayout>
                <Toaster />
            </UserProfileProvider>
        </SessionContextProvider>
    );
}