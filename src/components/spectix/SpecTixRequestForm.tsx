import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useCube } from "@/contexts/CubeContext"
import { toast } from "@/hooks/use-toast"

interface SpecTixFormData {
  eventName: string
  venue: string
  eventDate: string
  seatingArea: string
  numberOfTickets: string
  maxPrice: string
}

export function SpecTixRequestForm({ onRequestCreated }: { onRequestCreated?: () => void }) {
  const [formData, setFormData] = useState<SpecTixFormData>({
    eventName: "",
    venue: "",
    eventDate: "",
    seatingArea: "",
    numberOfTickets: "",
    maxPrice: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { setCubeData, setPreviewMode } = useCube()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await setCubeData({
        type: "spectix",
        eventName: formData.eventName,
        venue: formData.venue,
        date: formData.eventDate,
        seatingArea: formData.seatingArea,
        numberOfTickets: formData.numberOfTickets,
        maxPrice: formData.maxPrice
      })
      setPreviewMode(true)
      onRequestCreated?.()
      toast({
        title: "Request Created",
        description: "Your SpecTix request has been created successfully."
      })
    } catch (error) {
      console.error("Error creating SpecTix request:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create SpecTix request. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 border-neutral-200/60 shadow-lg shadow-neutral-900/5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Create Your SpecTix Request TicketCube™</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Event Name"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              required
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <Input
              placeholder="Venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="Event Date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <Input
              placeholder="Seating Area"
              value={formData.seatingArea}
              onChange={(e) => setFormData({ ...formData, seatingArea: e.target.value })}
              required
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Number of Tickets"
              value={formData.numberOfTickets}
              onChange={(e) => setFormData({ ...formData, numberOfTickets: e.target.value })}
              required
              min="1"
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Maximum Price per Ticket"
              value={formData.maxPrice}
              onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
              required
              min="0"
              className="border-neutral-200/60 focus:border-neutral-400 transition-colors"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-900 hover:to-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create SpecTix Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}