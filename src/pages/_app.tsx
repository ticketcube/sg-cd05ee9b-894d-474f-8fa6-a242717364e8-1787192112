import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import "@/styles/globals.css";

import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";

// ✅ PostHog
import posthog, { initPosthog } from "@/lib/posthog";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    initPosthog();

    // ✅ Track client-side route changes for heatmaps/session replays
    const handleRouteChange = (url: string) => {
      posthog.capture('$pageview', { path: url });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <AuthProvider>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
      <Toaster />
    </AuthProvider>
  );
}
