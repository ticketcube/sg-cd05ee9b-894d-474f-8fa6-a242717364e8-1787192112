
import { Navbar } from "@/components/layout/Navbar"
import { SpecTixRequestForm } from "@/components/spectix/SpecTixRequestForm"
import { CubeViewer } from "@/components/3d/CubeViewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Head from "next/head"
import { useState } from "react"

export default function SpecTixPage() {
  const [requestCreated, setRequestCreated] = useState(false)

  const steps = [
    {
      title: "Create",
      steps: [
        "Tell us Who/When/Where you want to see",
        "Tell us how many tickets you want, where you want to sit and the maximum per ticket you want to pay"
      ]
    },
    {
      title: "Secure",
      steps: [
        "SpecTix will create and issue a SpecTix TicketCube which you purchase for $1",
        "You will receive three Offers that best meet your request at three different times before the event - usually before or right after the onsale, three weeks before the event, and two days before the event"
      ]
    },
    {
      title: "Purchase",
      steps: [
        "You can BUY the tickets offered with a flat 15% service fee, lower than any other marketplace",
        "Once you buy your tickets, or even if buy them elsewhere, the TicketCube will be yours to customize as you see fit. A 3D Digital Collectible"
      ]
    }
  ]

  return (
    <>
      <Head>
        <title>SpecTix - Authorized Ticket Request Service</title>
        <meta name="description" content="SpecTix - The authorized ticket request service powered by TicketCube™" />
      </Head>

      <Navbar />

      <main className="container mx-auto min-h-screen pt-20 md:pt-24 px-4 md:px-6 lg:px-8">
        <section className="text-center mb-12 md:mb-16 animate-fade-up">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            SpecTix
          </h1>
          <p className="text-xl font-semibold text-muted-foreground mt-4">
            authorized ticket request service
          </p>
          <p className="text-lg mt-2">
            home of the TicketCube™
          </p>
          <p className="mt-8 text-lg text-muted-foreground max-w-[900px] mx-auto">
            Buying tickets to a hot show or game is expensive, time consuming and can be risky. 
            Speculative Tickets make things even worse. Speculative Tickets are postings on ticket 
            marketplaces that don't actually exist. These can be listings before the event is onsale 
            or listings at such a high price that a broker will simply buy and resell another listing. 
            The solution? SpecTix - a service where we find the tickets you want for the price you want to pay.
          </p>
        </section>

        <section className="mb-12 md:mb-16 animate-fade-up delay-150">
          <Card>
            <CardHeader>
              <CardTitle>How SpecTix Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {steps.map((group, groupIndex) => (
                  <Card key={groupIndex} className="p-4">
                    <CardTitle className="text-lg mb-4">{group.title}</CardTitle>
                    <div className="space-y-4">
                      {group.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="text-sm">
                          <span className="font-semibold">{groupIndex * 2 + stepIndex + 1}. </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 md:grid-cols-2 mb-16 animate-fade-up delay-300">
          <div>
            <SpecTixRequestForm onRequestCreated={() => setRequestCreated(true)} />
          </div>
          <div className="flex flex-col gap-4">
            <CubeViewer />
          </div>
        </section>
      </main>
    </>
  )
}
