import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X } from "lucide-react";
import { newsletterService } from "@/services/newsletterService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NewsletterSignupOverlayProps {
  onSubscribed: () => void;
  onClose?: () => void;
}

export function NewsletterSignupOverlay({ onSubscribed, onClose }: NewsletterSignupOverlayProps) {
  const [email, setEmail] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableCities();
  }, []);

  const loadAvailableCities = async () => {
    try {
      console.log("Loading cities from ticketmaster_events...");
      
      const { data, error } = await supabase
        .from("ticketmaster_events")
        .select("venue_city")
        .eq("is_active", true);

      console.log("Cities query result:", { data, error });

      if (error) {
        console.error("Error loading cities:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("No active events found with cities");
        return;
      }

      const uniqueCities = Array.from(
        new Set(data?.map(event => event.venue_city).filter(Boolean))
      ).sort();

      console.log("Unique cities found:", uniqueCities);
      setAvailableCities(uniqueCities as string[]);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Remove strict city validation - allow any city input
    // Users can enter their city even if it's not in our current event list
    const normalizedCity = homeCity.trim();

    setLoading(true);

    try {
      const result = await newsletterService.subscribe(email, normalizedCity || undefined);

      if (result.success) {
        toast.success(result.message);
        
        localStorage.setItem("newsletter_email", email);
        if (normalizedCity) {
          localStorage.setItem("newsletter_home_city", normalizedCity);
          console.log("✅ Saved home city to localStorage:", normalizedCity);
        }

        const response = await fetch("/api/newsletter/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            unsubscribeToken: result.subscriber?.unsubscribe_token 
          })
        });

        if (!response.ok) {
          console.warn("Welcome email failed to send, but subscription succeeded");
        }

        onSubscribed();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <img 
              src="/otwlive.png" 
              alt="OTW Live" 
              className="w-16 h-16 object-contain mx-auto"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 space-y-3 text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">Welcome to OTW Discovery Club</strong>
            </p>
            <p>
              As a subscriber, once a week you'll receive an exclusive list of OTW Artists' shows in your city.
            </p>
            <p>
              Every week you'll know who is playing this weekend and who's coming up.
            </p>
            <p>
              See the shows, watch the artist videos, and reserve a ticket all in three clicks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="text"
                placeholder="Home City (optional)"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full"
                list="cities-list"
                disabled={loading}
              />
              <datalist id="cities-list">
                {availableCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">
                We'll prioritize shows in your city
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-4">
            By subscribing, you agree to receive weekly emails from OnesToWatch. 
            You can unsubscribe at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
