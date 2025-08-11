
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
    <Card>
      <CardHeader>
        <CardTitle>Create Your SpecTix Request TicketCube™</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Event Name"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="Event Date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              placeholder="Seating Area"
              value={formData.seatingArea}
              onChange={(e) => setFormData({ ...formData, seatingArea: e.target.value })}
              required
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create SpecTix Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
