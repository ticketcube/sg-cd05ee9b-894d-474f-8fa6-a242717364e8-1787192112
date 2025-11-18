import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type NewsletterSubscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
type NewsletterInsert = Database["public"]["Tables"]["newsletter_subscribers"]["Insert"];

export interface NewsletterSignupData {
  email: string;
  home_city?: string;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  lastEmailSent: string | null;
}

class NewsletterService {
  async subscribe(email: string, homeCity?: string): Promise<{ success: boolean; message: string; subscriber?: NewsletterSubscriber }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const { data: existing, error: checkError } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("email", normalizedEmail)
        .single();

      if (existing) {
        if (existing.status === "unsubscribed") {
          const updateData: any = { 
            status: "active",
            subscribed_at: new Date().toISOString()
          };
          
          if (homeCity) {
            updateData.home_city = homeCity;
          }

          const { data: resubscribed, error: updateError } = await supabase
            .from("newsletter_subscribers")
            .update(updateData)
            .eq("email", normalizedEmail)
            .select()
            .single();

          if (updateError) throw updateError;

          return {
            success: true,
            message: "Welcome back! You've been resubscribed.",
            subscriber: resubscribed
          };
        }

        return {
          success: true,
          message: "You're already subscribed!",
          subscriber: existing
        };
      }

      const insertData: any = {
        email: normalizedEmail,
        status: "active"
      };

      if (homeCity) {
        insertData.home_city = homeCity;
      }

      const { data: newSubscriber, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        message: "Successfully subscribed!",
        subscriber: newSubscriber
      };
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      return {
        success: false,
        message: "Failed to subscribe. Please try again.",
      };
    }
  }

  async unsubscribe(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed" })
        .eq("unsubscribe_token", token)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          message: "Invalid unsubscribe token or already unsubscribed."
        };
      }

      return {
        success: true,
        message: "You've been successfully unsubscribed."
      };
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return {
        success: false,
        message: "Failed to unsubscribe. Please try again."
      };
    }
  }

  async getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("status", "active")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching active subscribers:", error);
      return [];
    }
  }

  async getStats(): Promise<NewsletterStats> {
    try {
      const { data: subscribers, error } = await supabase
        .from("newsletter_subscribers")
        .select("status, last_email_sent_at");

      if (error) throw error;

      const stats = {
        totalSubscribers: subscribers?.length || 0,
        activeSubscribers: subscribers?.filter(s => s.status === "active").length || 0,
        unsubscribedCount: subscribers?.filter(s => s.status === "unsubscribed").length || 0,
        lastEmailSent: null as string | null
      };

      const lastSent = subscribers
        ?.filter(s => s.last_email_sent_at)
        .sort((a, b) => {
          const dateA = new Date(a.last_email_sent_at!).getTime();
          const dateB = new Date(b.last_email_sent_at!).getTime();
          return dateB - dateA;
        })[0];

      if (lastSent?.last_email_sent_at) {
        stats.lastEmailSent = lastSent.last_email_sent_at;
      }

      return stats;
    } catch (error) {
      console.error("Error fetching newsletter stats:", error);
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        unsubscribedCount: 0,
        lastEmailSent: null
      };
    }
  }

  async updateLastEmailSent(subscriberIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ last_email_sent_at: new Date().toISOString() })
        .in("id", subscriberIds);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating last email sent:", error);
    }
  }

  async isEmailSubscribed(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("status")
        .eq("email", email.toLowerCase().trim())
        .eq("status", "active")
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }

  async updateHomeCity(email: string, homeCity: string | null): Promise<{ success: boolean; message: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log("🔍 Calling API to update home_city:", { 
        email: normalizedEmail, 
        homeCity,
        timestamp: new Date().toISOString()
      });

      const response = await fetch("/api/newsletter/update-city", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          homeCity
        })
      });

      const result = await response.json();

      console.log("📊 API response:", result);

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.message || "Failed to update city preference."
        };
      }

      return {
        success: true,
        message: result.message
      };
    } catch (error: any) {
      console.error("💥 Error calling update-city API:", error);
      return {
        success: false,
        message: `Failed to update: ${error?.message || "Unknown error"}`
      };
    }
  }

  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | null> {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, home_city, status, unsubscribe_token, subscribed_at, last_email_sent_at, created_at")
        .eq("email", email.toLowerCase().trim())
        .eq("status", "active")
        .single();

      if (error || !data) return null;
      return data;
    } catch (error) {
      console.error("Error fetching subscriber:", error);
      return null;
    }
  }
}

export const newsletterService = new NewsletterService();
