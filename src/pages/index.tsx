import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { NewsletterSignupOverlay } from "@/components/NewsletterSignupOverlay";

export default function HomePage() {
  const router = useRouter();
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Check if user is already subscribed
  useEffect(() => {
    const email = localStorage.getItem("newsletter_email");
    if (email) {
      // User already subscribed, redirect to newsletter page
      router.replace("/newsletter");
    } else {
      setCheckingSubscription(false);
    }
  }, [router]);

  const handleSubscribed = () => {
    // After successful subscription, redirect to newsletter page
    router.push("/newsletter");
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>OnesToWatch - Subscribe to OTW Live</title>
        <meta
          name="description"
          content="Subscribe to receive weekly updates on emerging artists performing in your city."
        />
      </Head>

      {/* Full-screen overlay - this is what user sees first */}
      <NewsletterSignupOverlay 
        onSubscribed={handleSubscribed}
        // No onClose prop - user cannot close it without subscribing
      />
    </>
  );
}