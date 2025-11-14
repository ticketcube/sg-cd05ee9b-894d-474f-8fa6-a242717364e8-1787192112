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
      
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div class="ticketcube-embed-container">
                  <iframe
                      src="https://www.ticketcube.io/cube/template/your-city-mhxs14kq"
                      width="100%"
                      height="800"
                      frameborder="0"
                      allowfullscreen
                  ></iframe>
              </div>

              <style>
                  .ticketcube-embed-container {
                      max - width: 800px;
                  margin: 40px auto;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                  border-radius: 16px;
                  overflow: hidden;
  }

                  .ticketcube-embed-container iframe {
                      display: block;
  }
              </style>
      </main>
    </>
  )
}
