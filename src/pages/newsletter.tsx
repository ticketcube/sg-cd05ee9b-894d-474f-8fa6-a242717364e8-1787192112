import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, ExternalLink, ChevronDown, ChevronUp, Ticket } from "lucide-react";
import CityCombobox from "@/components/CityCombobox";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";

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
  artist_name?: string | null;
  artist_image?: string | null;
  artist_videolink?: string | null;
}

export default function NewsletterPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [thisWeekendEvents, setThisWeekendEvents] = useState<NewsletterEvent[]>([]);
  const [nextWeekEvents, setnextWeekEvents] = useState<NewsletterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string; normalized_name: string } | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string>("all");
  const [artistSearch, setArtistSearch] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [weekendExpanded, setWeekendExpanded] = useState(true);
  const [nextWeekExpanded, setnextWeekExpanded] = useState(true);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Load events if subscribed
  useEffect(() => {
    if (isSubscribed) loadEvents();
  }, [isSubscribed]);

    const handleCityChange = (city: any, customInput?: string) => {
      if (city) {
        setSelectedCity(city);
        setSelectedCityName(city.normalized_name);
      } else if (customInput) {
        setSelectedCity(null);
        setSelectedCityName(customInput);
      } else {
        setSelectedCity(null);
        setSelectedCityName("all");
      }
    };

    // Set default city from localStorage or default to Los Angeles
    useEffect(() => {
        if (isSubscribed && availableCities.length > 0) {
            const savedHomeCity = localStorage.getItem("newsletter_home_city");

            if (savedHomeCity) {
                // Check if saved city exists in available cities (case-insensitive)
                const cityMatch = availableCities.find(
                    city => city.toLowerCase() === savedHomeCity.toLowerCase()
                );

                if (cityMatch) {
                    console.log("✅ Setting filter to saved home city:", cityMatch);
                    setSelectedCityName(cityMatch);
                    return;
                }
            }

            // Default to Los Angeles if no match or no saved city
            const losAngeles = availableCities.find(
                city => city.toLowerCase() === "los angeles"
            );

            if (losAngeles) {
                console.log("✅ Defaulting filter to Los Angeles");
                setSelectedCityName(losAngeles);
            }
        }
    }, [isSubscribed, availableCities]);

  // Handle mobile expand/collapse
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
    if (email) localStorage.setItem("newsletter_email", email);
  };

  // Load events function
  const loadEvents = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // --- THIS WEEKEND (Thu → Sun) ---
      const day = today.getDay();
      const thisThursday = new Date(today);
      const daysUntilThursday = (4 - day + 7) % 7;
      thisThursday.setDate(today.getDate() + daysUntilThursday);
      const thisSunday = new Date(thisThursday);
      thisSunday.setDate(thisThursday.getDate() + 3);

      // --- NEXT WEEK (Mon → Sun) ---
      const nextMonday = new Date(thisSunday);
      nextMonday.setDate(thisSunday.getDate() + 1);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);

      const fmt = (d: Date) => d.toISOString().split("T")[0];
      const thuStr = fmt(thisThursday);
      const sunStr = fmt(thisSunday);
      const nextMonStr = fmt(nextMonday);
      const nextSunStr = fmt(nextSunday);

      console.log("📅 Loading events:", {
        thisWeekend: `${thuStr} → ${sunStr}`,
        nextWeek: `${nextMonStr} → ${nextSunStr}`
      });

      // --- Fetch THIS WEEKEND ---
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
          artist_name,
          artist_image,
          artist_videolink
        `)
        .eq("is_active", true)
        .gte("event_date", thuStr)
        .lte("event_date", sunStr)
        .order("event_date");

      if (weekendError) console.error("Weekend fetch error:", weekendError);

      // --- Fetch NEXT WEEK ---
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
          event_url,
          artist_name,
          artist_image,
          artist_videolink
        `)
        .eq("is_active", true)
        .gte("event_date", nextMonStr)
        .lte("event_date", nextSunStr)
        .order("event_date");

      if (nextWeekError) console.error("Next week fetch error:", nextWeekError);

      setThisWeekendEvents(weekendData || []);
      setnextWeekEvents(nextWeekData || []);

      // Extract unique cities
      const allEvents = [...(weekendData || []), ...(nextWeekData || [])];
      const uniqueCities = [...new Set(allEvents.map(e => e.venue_city))].sort();
      setAvailableCities(uniqueCities);
      setSelectedCity(null);
      setSelectedCityName("all");
    } catch (err) {
      console.error("💥 Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: NewsletterEvent[]) => {
    let filtered = events;
    if (selectedCityName !== "all") {
      filtered = filtered.filter(e => e.venue_city.toLowerCase() === selectedCityName.toLowerCase());
    }
    if (artistSearch.trim()) {
      filtered = filtered.filter(e => e.event_name.toLowerCase().includes(artistSearch.toLowerCase()));
    }
    return filtered;
  };

  const groupEventsByDate = (events: NewsletterEvent[]) => {
    const grouped: { [date: string]: NewsletterEvent[] } = {};
    events.forEach(e => {
      if (!grouped[e.event_date]) grouped[e.event_date] = [];
      grouped[e.event_date].push(e);
    });
    return grouped;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };



  const WeekendEventsSection = () => {
      const filtered = filterEvents(thisWeekendEvents);
      if (filtered.length === 0) return null;
    const grouped = groupEventsByDate(filtered);
    const dates = Object.keys(grouped).sort();
    return (
      <Card>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setWeekendExpanded(!weekendExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎵 This Weekend {weekendExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">{filtered.length} {filtered.length === 1 ? "event" : "events"}</p>
            </div>
          </div>
        </CardHeader>
            {weekendExpanded && (
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
                            <p>No events found</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {dates.map(date => (
                                <div key={date}>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                                        {formatDate(date)}
                                    </h3>
                                    {/* Updated grid: 1 column mobile, 2 columns desktop */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                        {grouped[date].map(event => (
                                            <EventCard key={event.event_id} event={event} />
                                        ))}
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

  const NextWeekEventsSection = () => {
      const filtered = filterEvents(nextWeekEvents);
      if (filtered.length === 0) return null;

    const grouped = groupEventsByDate(filtered);
    const dates = Object.keys(grouped).sort();
    return (
      <Card>
        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setnextWeekExpanded(!nextWeekExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🎟️ Next Week {nextWeekExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">{filtered.length} {filtered.length === 1 ? "event" : "events"}</p>
            </div>
          </div>
        </CardHeader>
            {nextWeekExpanded && (
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="mx-auto mb-2 w-12 h-12 opacity-30" />
                            <p>No events found</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {dates.map(date => (
                                <div key={date}>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                                        {formatDate(date)}
                                    </h3>
                                    {/* Updated grid: 1 column mobile, 2 columns desktop */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                        {grouped[date].map(event => (
                                            <EventCard key={event.event_id} event={event} />
                                        ))}
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

  if (checkingSubscription) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>;

    return (
        <div className="min-h-screen px-4 pt-4">
            <div className="max-w-6xl mx-auto">

                {/* Improved headline */}
                <h1 className="mb-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                    Discover What’s Happening This Week
                </h1>

                {!isSubscribed ? (
                    <NewsletterSignupOverlay onSubscribed={handleSubscribed} />
                ) : (
                    <>
                        {/* ONE ROW even on mobile */}
                        <div className="mb-6 flex flex-row gap-3 items-center w-full">

                            {/* City Selector */}
                            <div className="flex-1 min-w-0">
                                <div className="relative">
                                    {/* Location icon INSIDE the select box */}
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                                    <CityCombobox
                                        value={selectedCity}
                                        onValueChange={handleCityChange}
                                        placeholder="Select City"
                                        className="pl-9 py-2 h-10 text-sm"
                                    />
                                </div>

                                {/* Subtext */}
                                <p className="mt-1 text-xs text-gray-500">
                                    Showing: {selectedCityName}
                                </p>
                            </div>

                            {/* Search Field */}
                            <div className="flex-1 min-w-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search events..."
                                        value={artistSearch}
                                        onChange={(e) => setArtistSearch(e.target.value)}
                                        className="pl-9 py-2 h-10 text-sm"
                                    />
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    );

            <div className="space-y-6">
              <WeekendEventsSection />
              <NextWeekEventsSection />
            </div>

            {loading && <div className="text-center py-4"><p className="text-gray-500">Loading events...</p></div>}
          </>
        )}
      </div>
    </div>
  );
}
