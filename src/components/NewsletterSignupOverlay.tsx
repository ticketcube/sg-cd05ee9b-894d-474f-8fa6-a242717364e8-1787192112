import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X } from "lucide-react";
import { newsletterService } from "@/services/newsletterService";
import { toast } from "sonner";
import CityCombobox from "@/components/CityCombobox";

interface NewsletterSignupOverlayProps {
  onSubscribed: () => void;
  onClose?: () => void;
}

export function NewsletterSignupOverlay({ onSubscribed, onClose }: NewsletterSignupOverlayProps) {
  const [email, setEmail] = useState("");
  const [homeCity, setHomeCity] = useState<{ id: number; name: string; normalized_name: string } | null>(null);
  const [customCity, setCustomCity] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCityChange = (city: any, customInput?: string) => {
    if (city) {
      setHomeCity(city);
      setCustomCity("");
    } else if (customInput) {
      setHomeCity(null);
      setCustomCity(customInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    const finalCity = homeCity?.normalized_name || customCity;
    const normalizedCity = finalCity?.trim();

    setLoading(true);

    try {
      const result = await newsletterService.subscribe(email, normalizedCity || undefined);

      if (result.success) {
        toast.success(result.message);
        localStorage.setItem("newsletter_email", email);
        if (normalizedCity) {
          localStorage.setItem("newsletter_home_city", normalizedCity);
        }

        const response = await fetch("/api/newsletter/send-welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, unsubscribeToken: result.subscriber?.unsubscribe_token }),
        });

        if (!response.ok) console.warn("Welcome email failed to send, but subscription succeeded");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card 
        className="w-full max-w-md relative shadow-2xl rounded-xl overflow-hidden"
        style={{ backgroundColor: '#000000', borderColor: '#374151' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <CardHeader 
          className="text-center pb-4 pt-6"
          style={{ backgroundColor: '#000000' }}
        >
          <div className="mx-auto mb-4">
            <img
              src="/OTWLogo_BW.png"
              alt="OTW Live"
              className="w-32 h-32 object-contain mx-auto"
            />
          </div>
        </CardHeader>

        <CardContent 
          className="px-6 pb-6"
          style={{ backgroundColor: '#000000' }}
        >
          <div className="mb-6 space-y-3 text-sm text-center">
            <p>
              <strong className="text-white text-3xl block mb-2">
                Get updated when OTW Artists are in your town.
              </strong>
            </p>
            <p className="text-gray-300">
              Subscribers receive a weekly list of OTW Artists' weekend shows in your city.
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
                style={{ 
                  backgroundColor: '#000000', 
                  color: 'white', 
                  borderColor: '#4b5563' 
                }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <CityCombobox
                value={homeCity}
                onValueChange={handleCityChange}
                placeholder="Enter City (optional)"
                className="w-full"
              />
            </div>

            {(homeCity || customCity) && (
              <p className="text-xs text-purple-med flex items-center gap-1">
                <span>✓</span>
                <span>Selected: {homeCity?.normalized_name || customCity}</span>
              </p>
            )}

            <Button
              type="submit"
              className="w-full text-lg font-semibold py-6"
              style={{
                backgroundColor: 'white',
                color: 'black'
              }}
              disabled={loading}
            >
              {loading ? "Subscribing..." : "Subscribe Now"}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-6">
            By subscribing, you agree to receive weekly emails from OnesToWatch.
            You can unsubscribe at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
