
import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ExternalLink, ChevronDown, ChevronUp, Ticket, MapPin } from "lucide-react";
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
}

export default function NewsletterPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [thisWeekendEvents, setThisWeekendEvents] = useState<NewsletterEvent[]>([]);
  const [thisMonthEvents, setThisMonthEvents] = useState<NewsletterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [artistSearch, setArtistSearch] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [weekendExpanded, setWeekendExpanded] = useState(true);
  const [monthExpanded, setMonthExpanded] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);

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
        setMonthExpanded(false);
      } else {
        setWeekendExpanded(true);
        setMonthExpanded(true);
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
      
      if (subscribed) {
        const subscriber = await newsletterService.getSubscriberByEmail(email);
        if (subscriber?.home_city) {
          console.log("🏠 Found subscriber home_city:", subscriber.home_city);
          setSelectedCity(subscriber.home_city);
        } else {
          console.log("🏠 No home_city found, defaulting to Los Angeles");
          setSelectedCity("Los Angeles");
        }
      }
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

  const findNearestCity = async (lat: number, lon: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("city_latlong")
        .select("city_name, lat, long")
        .not("lat", "is", null)
        .not("long", "is", null);

      if (error || !data || data.length === 0) {
        console.error("Error fetching cities for location:", error);
        return null;
      }

      let nearestCity = data[0].city_name;
      let minDistance = Infinity;

      data.forEach(city => {
        const cityLat = parseFloat(city.lat as string);
        const cityLon = parseFloat(city.long as string);
        
        const distance = Math.sqrt(
          Math.pow(lat - cityLat, 2) + Math.pow(lon - cityLon, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city.city_name;
        }
      });

      console.log("📍 Nearest city found:", nearestCity);
      return nearestCity;
    } catch (error) {
      console.error("Error finding nearest city:", error);
      return null;
    }
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Got user location:", { latitude, longitude });
        
        const nearestCity = await findNearestCity(latitude, longitude);
        
        if (nearestCity && availableCities.includes(nearestCity)) {
          setSelectedCity(nearestCity);
          console.log("✅ Set city filter to:", nearestCity);
        } else if (nearestCity) {
          console.log("⚠️ Nearest city not in available cities, defaulting to 'all'");
          setSelectedCity("all");
        } else {
          alert("Could not find nearest city. Please select manually.");
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Could not get your location. Please select a city manually.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisSunday = new Date(today);
      const daysUntilSunday = (7 - today.getDay()) % 7;
      thisSunday.setDate(today.getDate() + daysUntilSunday);
      
      if (today.getDay() === 0) {
        thisSunday.setDate(today.getDate());
      }

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const todayStr = today.toISOString().split('T')[0];
      const sundayStr = thisSunday.toISOString().split('T')[0];
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

      console.log("📅 Loading events for date ranges:", { 
        weekend: `${todayStr} to ${sundayStr}`,
        month: `After ${sundayStr} to ${endOfMonthStr}`
      });

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
          event_url
        `)
        .eq("is_active", true)
        .gt("event_date", sundayStr)
        .lte("event_date", endOfMonthStr)
        .order("event_date", { ascending: true });

      if (monthError) {
        console.error("❌ Month events error:", monthError);
      } else {
        console.log("✅ Month events loaded:", monthData?.length || 0);
      }

      const weekendEvents = weekendData || [];
      const monthEvents = monthData || [];

      setThisWeekendEvents(weekendEvents);
      setThisMonthEvents(monthEvents);

      const allEvents = [...weekendEvents, ...monthEvents];
      const uniqueCities = Array.from(
        new Set(allEvents.map(e => e.venue_city))
      ).sort();
      
      console.log("🌆 Available cities:", uniqueCities.length, uniqueCities.slice(0, 10));
      setAvailableCities(uniqueCities);
      
      console.log("✅ Events loaded successfully:", {
        weekend: weekendEvents.length,
        month: monthEvents.length,
        cities: uniqueCities.length,
        currentFilter: selectedCity
      });
    } catch (error) {
      console.error("💥 Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: NewsletterEvent[]) => {
    let filtered = events;

    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter(event => 
        event.venue_city.toLowerCase() === selectedCity.toLowerCase()
      );
    }

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
                  onClick={() => {}}
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
    const filteredEvents = filterEvents(thisMonthEvents);

    return (
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setMonthExpanded(!monthExpanded)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                📅 This Month
                {monthExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
        </CardHeader>
        {monthExpanded && (
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
                <p>No events found</p>
              </div>
            ) : (
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
                    {filteredEvents.map(event => (
                      <TicketPurchaseRow key={event.event_id} event={event} />
                    ))}
                  </tbody>
                </table>
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">OTW Live</h1>
          <p className="text-gray-600">Never miss a show from your favorite emerging artists</p>
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

              <div className="w-full md:w-auto">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  &nbsp;
                </label>
                <Button
                  variant="outline"
                  onClick={handleUseMyLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {gettingLocation ? "Getting Location..." : "Use My Location"}
                </Button>
              </div>

              <div className="w-full md:flex-1">
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
