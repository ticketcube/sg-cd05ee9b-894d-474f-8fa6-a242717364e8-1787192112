import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";  // ✅ FIXED
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";
import type { Database } from "@/integrations/supabase/types";

// ✅ PostHog
import { initPosthog } from "@/lib/posthog";

const supabase = createPagesBrowserClient<Database>(); 

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    // Create client with proper typing
    const [supabaseClient] = useState(() => createBrowserSupabaseClient<Database>());

    useEffect(() => {
        initPosthog();
    }, []);

    return (
        <SessionContextProvider 
            supabaseClient={supabase} 
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
