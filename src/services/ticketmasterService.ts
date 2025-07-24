
export interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city: {
        name: string;
      };
      state?: {
        name: string;
      };
      country: {
        name: string;
      };
    }>;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page: {
    totalElements: number;
  };
}

export interface ArtistWithEvents {
  artist_uuid: string;
  artist_name: string;
  artist_image: string | null;
  tmid: string;
  hasEvents: boolean;
  events: TicketmasterEvent[];
}

class TicketmasterService {
  async getArtistEvents(attractionId: string, size: number = 3): Promise<TicketmasterEvent[]> {
    try {
      const response = await fetch(`/api/ticketmaster/events?attractionId=${attractionId}&size=${size}`);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error("Error fetching Ticketmaster events:", error);
      return [];
    }
  }

  async checkArtistHasEvents(attractionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/ticketmaster/events?attractionId=${attractionId}&size=1`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return (data.totalElements || 0) > 0;
    } catch (error) {
      console.error("Error checking artist events:", error);
      return false;
    }
  }

  formatEventDate(event: TicketmasterEvent): string {
    const date = new Date(event.dates.start.localDate);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  getEventVenue(event: TicketmasterEvent): string {
    const venue = event._embedded?.venues?.[0];
    if (!venue) return "Venue TBA";
    
    const city = venue.city.name;
    const state = venue.state?.name;
    const country = venue.country.name;
    
    if (state) {
      return `${venue.name}, ${city}, ${state}`;
    } else {
      return `${venue.name}, ${city}, ${country}`;
    }
  }
}

export const ticketmasterService = new TicketmasterService();
