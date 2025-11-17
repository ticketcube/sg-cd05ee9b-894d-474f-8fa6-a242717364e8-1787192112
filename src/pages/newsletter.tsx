import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [selectedCityName, setSelectedCityName] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [useLocationAutomation, setUseLocationAutomation] = useState(false);
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

  // Set default city from localStorage or default to Los Angeles
  useEffect(() => {
    if (isSubscribed && availableCities.length > 0) {
      const savedHomeCity = localStorage.getItem("newsletter_home_city");

      if (savedHomeCity) {
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
            artist_videolink,
            primary_venue_image,
            primary_event_image,
            primary_attraction_image
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
            artist_videolink,
            primary_venue_image,
            primary_event_image,
            primary_attraction_image
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
    } catch (err) {
      console.error("💥 Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: NewsletterEvent[]) => {
    let filtered = events;
    
    // Filter by city
    if (selectedCityName !== "all") {
      filtered = filtered.filter(e => e.venue_city.toLowerCase() === selectedCityName.toLowerCase());
    }
    
    // Filter by search query (artist, event, or venue)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.artist_name?.toLowerCase().includes(query) ||
        e.event_name.toLowerCase().includes(query) ||
        e.venue_name.toLowerCase().includes(query)
      );
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

    const toggleWithScrollLock = (setter, value) => {
        const y = window.scrollY;     // save scroll position
        setter(value);                // toggle section
        setTimeout(() => window.scrollTo(0, y), 0);  // restore position
    };

  const WeekendEventsSection = () => {
    const filtered = filterEvents(thisWeekendEvents);
    if (filtered.length === 0) return null;
    const grouped = groupEventsByDate(filtered);
    const dates = Object.keys(grouped).sort();
    return (
      <Card>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleWithScrollLock(setWeekendExpanded, !weekendExpanded)}>
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
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleWithScrollLock(setnextWeekExpanded, !nextWeekExpanded)}>
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
      <div className="min-h-screen px-4">
          <div className="max-w-4xl mx-auto flex justify-center py-6">
              <Image
                  src="/otwlive.png"
                  alt="OTW Live"
                  width={100}      // slightly smaller
                  height={100}     // slightly smaller
                  className="rounded-md"
              />
          </div>
      <div className="max-w-6xl mx-auto">

        {!isSubscribed ? (
          <NewsletterSignupOverlay onSubscribed={handleSubscribed} />
        ) : (
          <>
            {/* Current City Label */}
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Current City: <span className="text-gray-900">{selectedCityName === "all" ? "All Cities" : selectedCityName}</span>
              </p>
            </div>

            {/* Three Column Control Row - Always 3 columns even on mobile */}
            <div className="mb-6 grid grid-cols-[auto_1fr_1fr] gap-2">
              {/* Location Automation Toggle - Small square */}
              

              {/* City Selector */}
              <div>
                <Select value={selectedCityName} onValueChange={setSelectedCityName}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select City" />
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

              {/* Search Box */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    type="text-xs" 
                    placeholder="Artist, Event or Venue" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                     className="pl-9 h-10 text-xs placeholder:text-xs"
                  />
                </div>
              </div>
            </div>

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
