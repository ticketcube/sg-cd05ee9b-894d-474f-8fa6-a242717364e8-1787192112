
import GrooverMap from "@/components/GrooverMap";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, TrendingUp, Calendar, MapPin } from "lucide-react";
import Head from "next/head";
import Link from "next/link";

export default function GrooverPage() {
  return (
    <>
      <Head>
        <title>Groover Artists Map | OTW</title>
        <meta name="description" content="Discover Groover artists from around the world on an interactive map." />
      </Head>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar>
            <SidebarHeader>
              <div className="px-4 py-2 text-lg font-semibold">OTW Chart</div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/top100">
                      <TrendingUp className="w-4 h-4" />
                      <span>Top 100</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/weekly">
                      <Calendar className="w-4 h-4" />
                      <span>Weekly</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <Link href="/groover">
                      <MapPin className="w-4 h-4" />
                      <span>Groover Map</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <GrooverMap />
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
