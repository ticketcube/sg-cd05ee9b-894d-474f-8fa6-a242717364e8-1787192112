import { ReactNode } from "react";
import Head from "next/head";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";

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
// Notice all the state and event handlers that were here are now gone!
// This component is now much simpler.

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            <Toaster />
        </div>
    );
}
