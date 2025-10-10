import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // Register Service Worker
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("[PWA] Service Worker registered:", registration.scope);

                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 60000); // Check every minute

                        // Handle service worker updates
                        registration.addEventListener("updatefound", () => {
                            const newWorker = registration.installing;
                            if (!newWorker) return;

                            newWorker.addEventListener("statechange", () => {
                                if (
                                    newWorker.state === "installed" &&
                                    navigator.serviceWorker.controller
                                ) {
                                    // New service worker available
                                    toast("Update Available", {
                                        description: "A new version is ready. Refresh to update.",
                                        action: {
                                            label: "Refresh",
                                            onClick: () => window.location.reload(),
                                        },
                                        duration: Infinity,
                                    });
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.error("[PWA] Service Worker registration failed:", error);
                    });
            });

            // Handle online/offline status
            const handleOnline = () => {
                toast.success("Back Online", {
                    description: "Your connection has been restored.",
                });
            };

            const handleOffline = () => {
                toast.warning("You're Offline", {
                    description: "Some features may be limited.",
                });
            };

            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

            return () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
            };
        }
    }, []);

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
