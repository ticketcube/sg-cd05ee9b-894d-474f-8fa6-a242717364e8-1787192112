import Link from "next/link";
import Image from "next/image";
import UserNav from "@/components/layout/UserNav";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/OTWLogocolor.png"
              alt="OTW Chart Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="hidden font-bold sm:inline-block">
              OTW Chart
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}