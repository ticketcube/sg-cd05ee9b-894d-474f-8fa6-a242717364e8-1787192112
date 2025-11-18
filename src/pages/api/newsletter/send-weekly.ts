import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { brevoEmailService } from "@/lib/brevoEmailService";
import { weeklyEmailGenerator } from "@/lib/weeklyEmailGenerator";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "your-secret-key-here";

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
  primary_venue_image?: string | null;
  primary_event_image?: string | null;
  primary_attraction_image?: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { secret, testMode = false, testEmail } = req.body;

  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    console.log("📧 Starting weekly email send...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const thisThursday = new Date(today);
    const daysUntilThursday = (4 - day + 7) % 7;
    thisThursday.setDate(today.getDate() + daysUntilThursday);
    const thisSunday = new Date(thisThursday);
    thisSunday.setDate(thisThursday.getDate() + 3);

    const nextMonday = new Date(thisSunday);
    nextMonday.setDate(thisSunday.getDate() + 1);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const thuStr = fmt(thisThursday);
    const sunStr = fmt(thisSunday);
    const nextMonStr = fmt(nextMonday);
    const nextSunStr = fmt(nextSunday);

    console.log("📅 Fetching events:", {
      thisWeekend: `${thuStr} → ${sunStr}`,
      nextWeek: `${nextMonStr} → ${nextSunStr}`
    });

    const { data: weekendEvents, error: weekendError } = await supabase
      .from("ticketmaster_events")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", thuStr)
      .lte("event_date", sunStr)
      .order("event_date");

    if (weekendError) throw weekendError;

    const { data: nextWeekEvents, error: nextWeekError } = await supabase
      .from("ticketmaster_events")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", nextMonStr)
      .lte("event_date", nextSunStr)
      .order("event_date");

    if (nextWeekError) throw nextWeekError;

    console.log(`✅ Found ${weekendEvents?.length || 0} weekend events, ${nextWeekEvents?.length || 0} next week events`);

    let subscribers;
    if (testMode && testEmail) {
      // FIX: Fetch actual subscriber data for test email instead of creating fake subscriber
      console.log(`🧪 TEST MODE: Fetching real subscriber data for ${testEmail}`);
      
      const { data: testSubscriber, error: testSubError } = await supabase
        .from("newsletter_subscribers")
        .select("email, home_city, unsubscribe_token, status")
        .eq("email", testEmail.toLowerCase().trim())
        .eq("status", "active")
        .single();

      if (testSubError || !testSubscriber) {
        console.error("❌ Test subscriber not found or error:", testSubError);
        return res.status(404).json({
          success: false,
          message: `Test email ${testEmail} not found in subscribers database`
        });
      }

      subscribers = [testSubscriber];
      console.log(`✅ Found test subscriber with home_city: ${testSubscriber.home_city || "(none)"}`);
    } else {
      const { data, error: subError } = await supabase
        .from("newsletter_subscribers")
        .select("email, home_city, unsubscribe_token, status")
        .eq("status", "active");

      if (subError) throw subError;
      subscribers = data || [];
      console.log(`👥 Sending to ${subscribers.length} active subscribers`);
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      try {
        // 🔍 VERIFICATION LOG: Check what home_city value we have BEFORE filtering
        console.log(`\n🔍 PROCESSING SUBSCRIBER: ${subscriber.email}`);
        console.log(`   📍 Home City from DB: ${subscriber.home_city || "(none - will send all events)"}`);
        console.log(`   📊 Total Weekend Events Available: ${weekendEvents?.length || 0}`);
        console.log(`   📊 Total Next Week Events Available: ${nextWeekEvents?.length || 0}`);

        let weekendFiltered: NewsletterEvent[];
        let nextWeekFiltered: NewsletterEvent[];
        let subject: string;

        if (subscriber.home_city) {
          const normalizedCity = subscriber.home_city.toLowerCase();
          
          // 🔍 BEFORE FILTERING - Show what we're looking for
          console.log(`   🔄 FILTERING to city: "${normalizedCity}"`);
          console.log(`   📋 Sample venue_city values from events:`, 
            [...new Set((weekendEvents || []).slice(0, 5).map(e => e.venue_city))].join(", ")
          );
          
          weekendFiltered = (weekendEvents || []).filter(e => {
            const match = e.venue_city.toLowerCase() === normalizedCity;
            // Log first few comparisons for debugging
            if ((weekendEvents || []).indexOf(e) < 3) {
              console.log(`      🔍 Comparing "${e.venue_city.toLowerCase()}" === "${normalizedCity}": ${match}`);
            }
            return match;
          });
          
          nextWeekFiltered = (nextWeekEvents || []).filter(e => 
            e.venue_city.toLowerCase() === normalizedCity
          );
          
          // 🔍 AFTER FILTERING
          console.log(`   ✅ FILTERED Weekend Events: ${weekendFiltered.length}`);
          console.log(`   ✅ FILTERED Next Week Events: ${nextWeekFiltered.length}`);
          
          subject = `🎵 OTW LIVE This Week in ${subscriber.home_city}`;
          
          // 🔍 Show a sample of what cities we're seeing in ALL events if no matches
          if (weekendFiltered.length === 0 && nextWeekFiltered.length === 0) {
            const allEventCities = [
              ...(weekendEvents || []).map(e => e.venue_city),
              ...(nextWeekEvents || []).map(e => e.venue_city)
            ];
            const uniqueCities = [...new Set(allEventCities)].slice(0, 10);
            console.log(`   ⚠️ NO MATCHES FOUND FOR "${subscriber.home_city}"`);
            console.log(`   📍 Available cities in database:`, uniqueCities.join(", "));
            console.log(`   💡 Check if city name matches exactly (case-insensitive)`);
          }
        } else {
          weekendFiltered = weekendEvents || [];
          nextWeekFiltered = nextWeekEvents || [];
          subject = `🎵 OTW LIVE This Week`;
          console.log(`   🌍 NO CITY SET - sending ALL events`);
        }

        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://otwchart.com"}/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
        const newsletterPageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://otwchart.com"}/newsletter`;

        const emailData = {
          weekendEvents: weekendFiltered as NewsletterEvent[],
          nextWeekEvents: nextWeekFiltered as NewsletterEvent[],
          subscriberCity: subscriber.home_city || undefined,
          unsubscribeUrl,
          subscriberEmail: subscriber.email,
          newsletterPageUrl
        };

        const htmlContent = weeklyEmailGenerator.generateWeeklyEmailHTML(emailData);
        const textContent = weeklyEmailGenerator.generateWeeklyEmailText(emailData);

        const result = testMode 
          ? await brevoEmailService.sendTestEmail(subscriber.email, subject, htmlContent, textContent)
          : await brevoEmailService.sendEmail({
              to: [{ email: subscriber.email }],
              subject,
              htmlContent,
              textContent
            });

        if (result.success) {
          sent++;
          console.log(`✅ Sent to ${subscriber.email}`);

          if (!testMode) {
            await supabase
              .from("newsletter_subscribers")
              .update({ last_email_sent_at: new Date().toISOString() })
              .eq("email", subscriber.email);
          }
        } else {
          failed++;
          errors.push(`${subscriber.email}: ${result.error}`);
          console.error(`❌ Failed to send to ${subscriber.email}:`, result.error);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${subscriber.email}: ${errorMsg}`);
        console.error(`❌ Error sending to ${subscriber.email}:`, error);
      }
    }

    console.log(`✅ Weekly email send complete: ${sent} sent, ${failed} failed`);

    return res.status(200).json({
      success: true,
      message: testMode ? "Test email sent successfully" : "Weekly emails sent successfully",
      stats: {
        sent,
        failed,
        totalSubscribers: subscribers.length,
        weekendEvents: weekendEvents?.length || 0,
        nextWeekEvents: nextWeekEvents?.length || 0
      },
      errors: failed > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("💥 Error sending weekly emails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send weekly emails",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}