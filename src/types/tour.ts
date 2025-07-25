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
  attractionId: string | null;
  hasEvents: boolean;
  events: TicketmasterEvent[];
  vote_count?: number;
  rank?: number;
}
