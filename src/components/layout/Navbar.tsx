
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <Link href="#" className="flex items-center justify-center" prefetch={false}>
        <span className="sr-only">OTWChart</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link href="/spectix" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          SpecTix
        </Link>
        <Link href="/ticketcube" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          TicketCube
        </Link>
        <Button>Sign In</Button>
      </nav>
    </header>
  )
}
