
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
  const [thisMonthEvents, setThisMonthEvents] = useState<NewsletterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [artistSearch, setArtistSearch] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [weekendExpanded, setWeekendExpanded] = useState(true);
  const [monthExpanded, setMonthExpanded] = useState(true);

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

            // Format YYYY-MM-DD
            const fmt = (d: Date) => d.toISOString().split("T")[0];
            const thuStr = fmt(thisThursday);
            const sundayStr = fmt(thisSunday);
            const nextMonStr = fmt(nextMonday);
            const nextSunStr = fmt(nextSunday);

            console.log("📅 Loading events:", {
                thisWeekend: `${thuStr} → ${sundayStr}`,
                nextWeek: `${nextMonStr} → ${nextSunStr}`
            });

            // --- Load THIS WEEKEND ---
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
                .gte("event_date", thuStr)
                .lte("event_date", sundayStr)
                .order("event_date");

            if (weekendError) console.error("Weekend fetch error:", weekendError);

            // --- Load NEXT WEEK ---
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
                .gte("event_date", nextMonStr)
                .lte("event_date", nextSunStr)
                .order("event_date");

            if (nextWeekError) console.error("Next week fetch error:", nextWeekError);

            // Save results
            const weekendEvents = weekendData || [];
            const nextWeekEvents = nextWeekData || [];

            setThisWeekendEvents(weekendEvents);
            setnextWeekEvents(nextWeekEvents);

            // Unique city list
            const allEvents = [...weekendEvents, ...nextWeekEvents];
            const uniqueCities = [...new Set(allEvents.map(e => e.venue_city))].sort();

            setAvailableCities(uniqueCities);
            setSelectedCity("all");

        } catch (err) {
            console.error("💥 Error loading events:", err);
        } finally {
            setLoading(false);
        }
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
                          <NextWeekEventsSection />
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
