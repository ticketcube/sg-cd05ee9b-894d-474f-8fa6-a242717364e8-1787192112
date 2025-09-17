import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // Define paths that should NOT have the main AppLayout
    const noLayoutPaths = ["/auth/callback", "/discovery-dashboard"];
    const needsLayout = !noLayoutPaths.includes(router.pathname);

    const PageComponent = (
        <>
            <Component {...pageProps} />
            <Toaster />
        </>
    );

    return (
        <UserProfileProvider>
            {needsLayout ? (
                <AppLayout>{PageComponent}</AppLayout>
            ) : (
                PageComponent
            )}
        </UserProfileProvider>
    );
}

export default MyApp;