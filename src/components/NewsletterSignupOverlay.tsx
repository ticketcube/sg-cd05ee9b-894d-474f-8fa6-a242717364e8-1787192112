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
    console.log("City selected:", city, "Custom input:", customInput);
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

    // Get final city value (from CityCombobox or custom input)
    const finalCity = homeCity?.normalized_name || customCity;
    const normalizedCity = finalCity?.trim();

    console.log("Submitting with city:", normalizedCity);

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
                  <div className="mb-6 space-y-3 text-sm text-center text-gray-900">
            <p>
              <strong className="text-gray-900">Welcome to OTW LIVE!</strong>
            </p>
            <p>
                          As a member, once a week you'll receive an exclusive list of OTW Artists' shows in your city. 
                      </p>
                      <p>
                          Discover Shows & Buy Tickets. v </p>
            <p>
                    We Reward Discoverry      ™

           
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Home City (optional)
              </label>
              <CityCombobox
                value={homeCity}
                onValueChange={handleCityChange}
                placeholder="Click here, then type your city..."
              />
              {!homeCity && !customCity && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  
                </p>
              )}
              {(homeCity || customCity) && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>✓</span>
                  <span>Selected: {homeCity?.normalized_name || customCity}</span>
                </p>
              )}
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
