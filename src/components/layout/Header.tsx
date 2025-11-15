import Link from "next/link";
import Image from "next/image";
import UserNav from "@/components/layout/UserNav";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/otwlive.png"
              alt="OTW Live"
              width={40}
              height={400}
              className="rounded-md"
            />
            <span className="hidden font-bold sm:inline-block">
              We Reward Discovery
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-4">
            <Link href="/download">
              <Button variant="ghost" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download App</span>
              </Button>
            </Link>
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
