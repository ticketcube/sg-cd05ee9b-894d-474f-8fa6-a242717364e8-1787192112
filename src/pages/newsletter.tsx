import { useState, useEffect } from "react";
import { newsletterService } from "@/services/newsletterService";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, MapPin, Navigation, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";




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
  const [savingCity, setSavingCity] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const { toast } = useToast();

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
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setWeekendExpanded(true);
            setnextWeekExpanded(false);
        }
        }, []);

  const checkSubscriptionStatus = async () => {
    const email = localStorage.getItem("newsletter_email");
    if (email) {
      setUserEmail(email);
      const subscribed = await newsletterService.isEmailSubscribed(email);
      setIsSubscribed(subscribed);
      
      // Load subscriber's home_city from database
      if (subscribed) {
        const subscriber = await newsletterService.getSubscriberByEmail(email);
        if (subscriber?.home_city) {
          localStorage.setItem("newsletter_home_city", subscriber.home_city);
        }
      }
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

  const handleSaveCity = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "No email found. Please sign up again.",
        variant: "destructive"
      });
      return;
    }

    setSavingCity(true);
    try {
      const cityToSave = selectedCityName === "all" ? null : selectedCityName;
      const result = await newsletterService.updateHomeCity(userEmail, cityToSave);

      if (result.success) {
        if (cityToSave) {
          localStorage.setItem("newsletter_home_city", cityToSave);
        } else {
          localStorage.removeItem("newsletter_home_city");
        }
        
        // Force immediate UI refresh after successful save
        console.log("✅ City saved successfully, refreshing UI state");
        
        toast({
          title: "Success!",
          description: result.message,
        });
        
        // Verify the update by fetching fresh subscriber data
        const subscriber = await newsletterService.getSubscriberByEmail(userEmail);
        if (subscriber?.home_city) {
          console.log("🔄 Verified home_city from database:", subscriber.home_city);
          localStorage.setItem("newsletter_home_city", subscriber.home_city);
          
          // Ensure the filter reflects the saved city
          const matchedCity = availableCities.find(
            c => c.toLowerCase() === subscriber.home_city.toLowerCase()
          );
          if (matchedCity && matchedCity !== selectedCityName) {
            setSelectedCityName(matchedCity);
            console.log("🔄 Updated filter to match saved city:", matchedCity);
          }
        } else if (!cityToSave) {
          // If user cleared their city, set to "all"
          setSelectedCityName("all");
          console.log("🔄 Updated filter to 'all' (no city set)");
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving city:", error);
      toast({
        title: "Error",
        description: "Failed to save city preference.",
        variant: "destructive"
      });
    } finally {
      setSavingCity(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get city from coordinates
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          
          const city = data.address?.city || data.address?.town || data.address?.village;
          
          if (city) {
            // Try to match with available cities
            const matchedCity = availableCities.find(
              c => c.toLowerCase() === city.toLowerCase()
            );
            
            if (matchedCity) {
              setSelectedCityName(matchedCity);
              toast({
                title: "Location Found!",
                description: `Set to ${matchedCity}. Click "Save City" to remember this.`,
              });
            } else {
              toast({
                title: "City Not Available",
                description: `${city} doesn't have events yet. Showing all cities.`,
              });
            }
          } else {
            toast({
              title: "Location Error",
              description: "Couldn't determine your city. Please select manually.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast({
            title: "Error",
            description: "Failed to get your location. Please select manually.",
            variant: "destructive"
          });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location Access Denied",
          description: "Please enable location access or select city manually.",
          variant: "destructive"
        });
        setGettingLocation(false);
      }
    );
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
      <div className="min-h-screen">
          {/* Black Header with Logo */}
          <header className="bg-black border-b border-gray-800">
              <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                  {/* Left side: logo */}
                  <div className="flex items-center">
                      <Image
                          src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/logo-o2w-1635877647.svg"
                          alt="Ones to Watch"
                          width={120}
                          height={40}
                          className="h-8 w-auto"
                      />
                  </div>

                  {/* Right side: button as link */}
                  <div className="flex items-center gap-4">
                      <Button asChild variant="default">
                          <Link href="/rewardshome" onClick={handleNavigationClick}>
                              Discover Rewards
                          </Link>
                      </Button>
                  </div>
              </div>
          </header>

          {/* Hero Headline */}
          <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
              <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                  <h1 className="text-4xl md:text-4xl lg:text-4xl font-bold text-gray-900 mb-2">
                      OnesToWatch Artists On Tour!
                  </h1>
                  <p className="text-lg text-gray-600 mt-4">
                      Discover the hottest emerging artists performing near you
                  </p>
              </div>
          </div>

          {/* Main Content */}
          <div className="px-4 py-8">
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

            {/* City Controls and Search */}
            <div className="mb-6 space-y-3">
              {/* City Selection Row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                {/* City Selector */}
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

                {/* Geo-location Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="h-10 w-10"
                  title="Use my location"
                >
                  {gettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </Button>

                {/* Save City Button */}
                <Button
                  variant="default"
                  onClick={handleSaveCity}
                  disabled={savingCity}
                  className="h-10 px-4"
                >
                  {savingCity ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save City
                    </>
                  )}
                </Button>
              </div>

              {/* Search Box - Full Width */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  type="text" 
                  placeholder="Search by Artist, Event or Venue" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="pl-9 h-10"
                />
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
      </div>
  );
}
