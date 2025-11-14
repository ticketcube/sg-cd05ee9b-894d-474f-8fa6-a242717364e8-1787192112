import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NewsletterEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  venue_name: string;
  venue_city: string;
  venue_state: string | null;
  venue_country: string;
  event_url: string;
  artist_uuid: string;
  artist_name: string;
  artist_image: string | null;
}

export default function NewsletterPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [thisWeekendEvents, setThisWeekendEvents] = useState<NewsletterEvent[]>([]);
  const [thisMonthEvents, setThisMonthEvents] = useState<NewsletterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      loadEvents();
    }
  }, [isSubscribed]);

  const checkSubscriptionStatus = async () => {
    const email = localStorage.getItem("newsletter_email");
    if (email) {
      const subscribed = await newsletterService.isEmailSubscribed(email);
      setIsSubscribed(subscribed);
    }
    setCheckingSubscription(false);
  };

  const handleSubscribed = () => {
    setIsSubscribed(true);
    const email = document.querySelector<HTMLInputElement>('input[type="email"]')?.value;
    if (email) {
      localStorage.setItem("newsletter_email", email);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + daysUntilFriday);
      
      const nextSunday = new Date(nextFriday);
      nextSunday.setDate(nextFriday.getDate() + 2);

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const fridayStr = nextFriday.toISOString().split('T')[0];
      const sundayStr = nextSunday.toISOString().split('T')[0];
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

      const { data: weekendData, error: weekendError } = await supabase
        .from("ticketmaster_events")
        .select(`
          event_id,
          event_name,
          event_date,
          event_time,
          venue_name,
          venue_city,
          venue_state,
          venue_country,
          event_url,
          artist_uuid,
          artists!ticketmaster_events_artist_uuid_fkey (
            artist_name,
            artist_image
          )
        `)
        .eq("is_active", true)
        .gte("event_date", fridayStr)
        .lte("event_date", sundayStr)
        .order("event_date", { ascending: true })
        .order("venue_city", { ascending: true });

      if (weekendError) throw weekendError;

      const { data: monthData, error: monthError } = await supabase
        .from("ticketmaster_events")
        .select(`
          event_id,
          event_name,
          event_date,
          event_time,
          venue_name,
          venue_city,
          venue_state,
          venue_country,
          event_url,
          artist_uuid,
          artists!ticketmaster_events_artist_uuid_fkey (
            artist_name,
            artist_image
          )
        `)
        .eq("is_active", true)
        .gt("event_date", sundayStr)
        .lte("event_date", endOfMonthStr)
        .order("event_date", { ascending: true })
        .order("venue_city", { ascending: true });

      if (monthError) throw monthError;

      const formatEvents = (data: any[]): NewsletterEvent[] => {
        return data.map(event => ({
          event_id: event.event_id,
          event_name: event.event_name,
          event_date: event.event_date,
          event_time: event.event_time,
          venue_name: event.venue_name,
          venue_city: event.venue_city,
          venue_state: event.venue_state,
          venue_country: event.venue_country,
          event_url: event.event_url,
          artist_uuid: event.artist_uuid,
          artist_name: event.artists?.artist_name || "Unknown Artist",
          artist_image: event.artists?.artist_image
        }));
      };

      setThisWeekendEvents(formatEvents(weekendData || []));
      setThisMonthEvents(formatEvents(monthData || []));
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: NewsletterEvent[]) => {
    if (!cityFilter.trim()) return events;
    
    const searchTerm = cityFilter.toLowerCase();
    return events.filter(event => 
      event.venue_city.toLowerCase().includes(searchTerm) ||
      event.venue_state?.toLowerCase().includes(searchTerm) ||
      event.artist_name.toLowerCase().includes(searchTerm)
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  const EventTable = ({ events, title }: { events: NewsletterEvent[]; title: string }) => {
    const filteredEvents = filterEvents(events);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events scheduled</p>
          ) : (
            <p className="text-sm text-gray-500">{filteredEvents.length} events</p>
          )}
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
              <p>No events found{cityFilter ? " for your search" : ""}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-3 font-medium">Artist</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Venue</th>
                    <th className="pb-3 font-medium">City</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.event_id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {event.artist_image && (
                            <img 
                              src={event.artist_image} 
                              alt={event.artist_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{event.artist_name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{event.event_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm">
                        {formatDate(event.event_date)}
                        {event.event_time && (
                          <span className="block text-gray-500">{event.event_time}</span>
                        )}
                      </td>
                      <td className="py-4 text-sm">{event.venue_name}</td>
                      <td className="py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{event.venue_city}</span>
                          {event.venue_state && <span>, {event.venue_state}</span>}
                        </div>
                      </td>
                      <td className="py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={event.event_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            Tickets
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">OTW Discovery Newsletter</h1>
          <p className="text-gray-600">Never miss a show from your favorite emerging artists</p>
        </div>

        {!isSubscribed && (
          <NewsletterSignupOverlay 
            onSubscribed={handleSubscribed}
          />
        )}

        {isSubscribed && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by city, state, or artist..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-6">
              <EventTable 
                events={thisWeekendEvents} 
                title="🎵 This Weekend" 
              />

              <EventTable 
                events={thisMonthEvents} 
                title="📅 This Month" 
              />
            </div>

            {loading && (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading events...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
