import { ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import { useUserProfile } from "@/contexts/UserProfileContext";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export default function AppLayout({
    children,
    title = "We Reward Discovery",
    description = "Discover the future of music.",
}: AppLayoutProps) {
    const router = useRouter();
    const { loading, sessionLoading, isStuck, logout } = useUserProfile();

    // Remove top padding for discovery-dashboard to have title start right after header
    const isDiscoveryDashboard = router.pathname === "/discovery-dashboard";
    const mainClasses = isDiscoveryDashboard 
        ? "flex-grow container mx-auto px-4 pb-8" // No top padding
        : "flex-grow container mx-auto px-4 py-8"; // Normal padding

    const renderContent = () => {
        if (sessionLoading || (loading && !isStuck)) {
            return <DashboardLoading />;
        }

        if (loading && isStuck) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
                    <h2 className="text-2xl font-bold mb-2">Session stuck</h2>
                    <p className="text-muted-foreground mb-6">We couldn't finish loading your profile.</p>
                    <Button onClick={logout}>Restart Session</Button>
                </div>
            );
        }

        return children;
    };

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={mainClasses}>
                {renderContent()}
            </main>

            <Toaster />
        </div>
    );
}