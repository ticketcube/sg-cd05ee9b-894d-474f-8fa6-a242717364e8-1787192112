import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
        <meta name="description" content="Page not found" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
          <iframe
              src="https://your-ticketcube-domain.com/embed/cube?cubeId=your-city-mhxs14kq"
              width="100%"
              height="800"
              frameborder="0"
              allowfullscreen
              style="border: none; border-radius: 12px;"
              title="Your City TicketCube"
          ></iframe>
    </>
  )
}
