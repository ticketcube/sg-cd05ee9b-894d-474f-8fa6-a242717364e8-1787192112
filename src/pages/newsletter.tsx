
import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ExternalLink, ChevronDown, ChevronUp, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";


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
}

export default function NewsletterPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [thisWeekendEvents, setThisWeekendEvents] = useState<NewsletterEvent[]>([]);
  const [nextWeekEvents, setnextWeekEvents] = useState<NewsletterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [artistSearch, setArtistSearch] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [weekendExpanded, setWeekendExpanded] = useState(true);
  const [nextWeekExpanded, setnextWeekExpanded] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      loadEvents();
    }
  }, [isSubscribed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setWeekendExpanded(true);
        setnextWeekExpanded(false);
      } else {
        setWeekendExpanded(true);
        setnextWeekExpanded(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    today.setHours(0, 0, 0, 0);

    //
    // --- THIS WEEKEND (Thu–Sun): unchanged ---
    //
    const thisThursday = new Date(today);
    const day = today.getDay(); // Sun=0, Mon=1, ... Sat=6

    // Find upcoming Thursday (this week's)
    const daysUntilThursday = (4 - day + 7) % 7;
    thisThursday.setDate(today.getDate() + daysUntilThursday);

    const thisSunday = new Date(thisThursday);
    thisSunday.setDate(thisThursday.getDate() + 3); // Thu + 3 = Sun

    //
    // --- NEXT WEEKEND (Mon–Sun of next week) ---
    //
    const nextMonday = new Date(thisThursday);
    nextMonday.setDate(thisThursday.getDate() + 4); // Mon after this Sun

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6); // Mon + 6 = Sun

    // Format YYYY-MM-DD
    const fmt = d => d.toISOString().split("T")[0];
    const todayStr = fmt(today);
    const thuStr = fmt(thisThursday);
    const sunStr = fmt(thisSunday);
    const nextMonStr = fmt(nextMonday);
    const nextSunStr = fmt(nextSunday);

    console.log("📅 Loading events for date ranges:", { 
      thisWeekend: `${thuStr} → ${sunStr}`,
      nextWeekend: `${nextMonStr} → ${nextSunStr}`
    });

      // Load weekend events
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
          event_url
        `)
        .eq("is_active", true)
        .gte("event_date", todayStr)
        .lte("event_date", sundayStr)
        .order("event_date", { ascending: true });

      if (weekendError) {
        console.error("❌ Weekend events error:", weekendError);
      } else {
        console.log("✅ Weekend events loaded:", weekendData?.length || 0);
      }

      // Load next week events
      const { data: nextWeekData, error: nextWeekError } = await supabase
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
          event_url
        `)
        .eq("is_active", true)
        .gt("event_date", sundayStr)
        .lte("event_date", endOfnextWeekStr)
        .order("event_date", { ascending: true });

      if (nextWeekError) {
        console.error("❌ nextWeek events error:", nextWeekError);
      } else {
        console.log("✅ nextWeek events loaded:", nextWeekData?.length || 0);
      }

      const weekendEvents = weekendData || [];
      const nextWeekEvents = nextWeekData || [];

      setThisWeekendEvents(weekendEvents);
      setnextWeekEvents(nextWeekEvents);

      // Extract unique cities from all loaded events
      const allEvents = [...weekendEvents, ...nextWeekEvents];
      const uniqueCities = Array.from(
        new Set(allEvents.map(e => e.venue_city))
      ).sort();
      
      console.log("🌆 Available cities:", uniqueCities.length, uniqueCities.slice(0, 10));
      setAvailableCities(uniqueCities);
      
      // Always start with "all" to show all events
      setSelectedCity("all");
      
      console.log("✅ Events loaded successfully:", {
        weekend: weekendEvents.length,
        nextWeek: nextWeekEvents.length,
        cities: uniqueCities.length
      });
    } catch (error) {
      console.error("💥 Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: NewsletterEvent[]) => {
    let filtered = events;

    // Filter by city if not "all"
    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter(event => 
        event.venue_city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Filter by event name search
    if (artistSearch.trim()) {
      const searchTerm = artistSearch.toLowerCase();
      filtered = filtered.filter(event => 
        event.event_name.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const groupEventsByDate = (events: NewsletterEvent[]) => {
    const grouped: { [date: string]: NewsletterEvent[] } = {};
    events.forEach(event => {
      if (!grouped[event.event_date]) {
        grouped[event.event_date] = [];
      }
      grouped[event.event_date].push(event);
    });
    return grouped;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  };

  const TicketPurchaseRow = ({ event }: { event: NewsletterEvent }) => {
    const isExpanded = expandedTicket === event.event_id;

    return (
      <>
        <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
          <td className="py-3 px-2">
            <div className="font-medium text-sm">{event.event_name}</div>
          </td>
          <td className="py-3 px-2 text-sm">{event.venue_name}</td>
          <td className="py-3 px-2 text-sm whitespace-nowrap">
            {formatDate(event.event_date)}
          </td>
          <td className="py-3 px-2 text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpandedTicket(isExpanded ? null : event.event_id)}
              className="flex items-center gap-1"
            >
              <Ticket className="w-4 h-4" />
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </td>
        </tr>
        {isExpanded && (
          <tr className="bg-gray-50 border-b">
            <td colSpan={4} className="py-4 px-2">
              <div className="flex gap-3 justify-center">
                <Button
                  asChild
                  className="flex items-center gap-2"
                >
                  <a 
                    href={event.event_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Buy Tickets
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {/* Will open WillCall component */}}
                  className="flex items-center gap-2"
                >
                  OTW Live WillCall
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center mt-2 text-xs text-gray-500">
                OTW Live WillCall - Coming Soon
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  const WeekendEventsSection = () => {
    const filteredEvents = filterEvents(thisWeekendEvents);
    const groupedEvents = groupEventsByDate(filteredEvents);
    const dates = Object.keys(groupedEvents).sort();

    return (
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setWeekendExpanded(!weekendExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎵 This Weekend
                {weekendExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
        </CardHeader>
        {weekendExpanded && (
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
                <p>No events found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dates.map(date => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                      {formatDate(date)}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-gray-50">
                          <tr className="text-left text-xs text-gray-600">
                            <th className="pb-2 px-2 font-medium">Event</th>
                            <th className="pb-2 px-2 font-medium">Venue</th>
                            <th className="pb-2 px-2 font-medium">Date</th>
                            <th className="pb-2 px-2 font-medium text-right">Tickets</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedEvents[date].map(event => (
                            <TicketPurchaseRow key={event.event_id} event={event} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const MonthEventsSection = () => {
    const filteredEvents = filterEvents(nextWeekEvents);
    const groupedEvents = groupEventsByDate(filteredEvents);
    const dates = Object.keys(groupedEvents).sort();

    return (
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setWeekendExpanded(!weekendExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎵 This Weekend
                {weekendExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
        </CardHeader>
        {weekendExpanded && (
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
                <p>No events found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dates.map(date => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                      {formatDate(date)}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-gray-50">
                          <tr className="text-left text-xs text-gray-600">
                            <th className="pb-2 px-2 font-medium">Event</th>
                            <th className="pb-2 px-2 font-medium">Venue</th>
                            <th className="pb-2 px-2 font-medium">Date</th>
                            <th className="pb-2 px-2 font-medium text-right">Tickets</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedEvents[date].map(event => (
                            <TicketPurchaseRow key={event.event_id} event={event} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
              <div className="mb-4 flex justify-center text-2xl font-bold">
                  OTW LIVE THIS WEEK!
              </div>

        {!isSubscribed && (
          <NewsletterSignupOverlay 
            onSubscribed={handleSubscribed}
          />
        )}

        {isSubscribed && (
          <>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-full md:w-64">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter by City
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-64">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Events
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Event name..."
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <WeekendEventsSection />
              <MonthEventsSection />
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
