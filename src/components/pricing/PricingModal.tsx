
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ticketCubeService } from "@/services/ticketCubeService";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cubeId: string | null;
}

// IMPORTANT: Replace these with your actual Price IDs from your Stripe dashboard
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_...';
const COLLECTOR_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_COLLECTOR_PRICE_ID || 'price_...';

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Secure your cube as-is.",
    features: [
      "Secures existing cube design",
      "No future updates enabled",
      "No engagement features",
    ],
    priceId: null,
  },
  {
    name: "Pro",
    price: "$25",
    description: "For those who want to evolve their cube.",
    features: [
      "Secures existing cube",
      "Allows 3 cube updates",
      "Gift 1 copy to a friend",
    ],
    priceId: PRO_PRICE_ID,
  },
  {
    name: "Collector",
    price: "$50",
    description: "The ultimate cube experience.",
    features: [
      "Secures existing cube",
      "Unlimited cube updates",
      "Gift up to 5 copies",
      "Minted to Sui Blockchain as TCUBE",
    ],
    priceId: COLLECTOR_PRICE_ID,
  },
];

export function PricingModal({ isOpen, onClose, cubeId }: PricingModalProps) {
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckout = async (priceId: string) => {
    if (!user || !cubeId) {
      toast({
        title: "Error",
        description: "User or Cube ID is missing.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPrice(priceId);
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: priceId,
          cubeId: cubeId,
          userId: user.id, // Use user.id (auth id)
        }),
      });

      const { sessionId } = await response.json();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Redirect to Stripe Checkout
      window.location.href = sessionId;
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: `Failed to initiate payment. ${errorMessage}`,
      });
      setLoadingPrice(null);
    }
  };

  const handleSelectTier = async (tier: (typeof tiers)[0]) => {
    if (!cubeId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and have a cube selected.",
      });
      return;
    }

    if (!tier.priceId) {
      try {
        await ticketCubeService.secureTicketCube(cubeId, user.id);
        toast({
          title: "Cube Secured!",
          description: "Your TicketCube has been secured with the Free plan.",
        });
        onClose();
        router.push('/my-cubes'); // Changed from '/ticketcube' to '/my-cubes'
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to secure your cube. Please try again.",
        });
      }
      return;
    }

    handleCheckout(tier.priceId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Secure Your TicketCube™</DialogTitle>
          <DialogDescription className="text-center">
            Choose a plan to secure your cube and unlock its full potential.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-4xl font-bold">{tier.price}</div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectTier(tier)}
                  disabled={!!loadingPrice}
                  className="w-full"
                >
                  {loadingPrice === tier.priceId ? "Processing..." : `Select ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}