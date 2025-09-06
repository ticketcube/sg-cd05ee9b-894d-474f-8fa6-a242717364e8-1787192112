import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
    const [supabaseClient] = useState(() => createPagesBrowserClient());
    const router = useRouter();

    // Define paths that should NOT have the main AppLayout
    const noLayoutPaths = ["/auth/callback"];
    const needsLayout = !noLayoutPaths.includes(router.pathname);

    const PageComponent = (
        <>
            <Component {...pageProps} />
            <Toaster />
        </>
    );

    return (
        <SessionContextProvider
            supabaseClient={supabaseClient as any}
            initialSession={pageProps.initialSession}
        >
            <UserProfileProvider>
                {needsLayout ? (
                    <AppLayout>{PageComponent}</AppLayout>
                ) : (
                    PageComponent
                )}
            </UserProfileProvider>
        </SessionContextProvider>
    );
}

export default MyApp;