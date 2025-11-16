/**
 * Generate TicketCube link with proper URL encoding
 * Base URL: https://ticketcube.io/cube/template/will-call-mi25aci8
 */

interface TicketCubeParams {
  otw_event_id: string;
  artist_slug?: string;
  event_date: string;
  event_time: string | null;
  venue: string;
  venue_city: string;
  venue_state: string | null;
  artist_img_url: string;
  venue_img_url: string;
}

export function generateTicketCubeLink(params: TicketCubeParams): string {
  const baseUrl = "https://ticketcube.io/cube/template/will-call-mi25aci8";
  
  // Use URLSearchParams for automatic encoding
  const searchParams = new URLSearchParams();
  
  searchParams.append("otw_event_id", params.otw_event_id);
  searchParams.append("event_date", params.event_date);
  searchParams.append("venue", params.venue);
  searchParams.append("venue_city", params.venue_city);
  searchParams.append("artist_img_url", params.artist_img_url);
  searchParams.append("venue_img_url", params.venue_img_url);
  
  // Add optional parameters
  if (params.artist_slug) {
    searchParams.append("artist_slug", params.artist_slug);
  }
  
  if (params.event_time) {
    searchParams.append("event_time", params.event_time);
  }
  
  if (params.venue_state) {
    searchParams.append("venue_state", params.venue_state);
  }
  
  return `${baseUrl}?${searchParams.toString()}`;
}