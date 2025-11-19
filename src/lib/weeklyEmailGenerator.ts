import type { Database } from "@/integrations/supabase/types";
import { wrapWithImpactTracking } from "@/lib/affiliateTracking";

type NewsletterEvent = {
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
};

interface WeeklyEmailData {
  weekendEvents: NewsletterEvent[];
  nextWeekEvents: NewsletterEvent[];
  subscriberCity?: string;
  unsubscribeUrl: string;
  subscriberEmail: string;
  newsletterPageUrl: string;
}

export class WeeklyEmailGenerator {
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  private formatTime(timeStr: string | null): string {
    if (!timeStr) return "TBA";
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return "TBA";
    }
  }

  private groupEventsByDate(events: NewsletterEvent[]): Record<string, NewsletterEvent[]> {
    return events.reduce((acc, event) => {
      if (!acc[event.event_date]) {
        acc[event.event_date] = [];
      }
      acc[event.event_date].push(event);
      return acc;
    }, {} as Record<string, NewsletterEvent[]>);
  }

  private getArtistImage(event: NewsletterEvent): string {
    if (event.artist_image && event.artist_image !== "null") {
      return event.artist_image;
    }
    if (event.primary_attraction_image && event.primary_attraction_image !== "null") {
      return event.primary_attraction_image;
    }
    if (event.primary_event_image && event.primary_event_image !== "null") {
      return event.primary_event_image;
    }
    return "https://onestowatch.live/OTWLogo_BW.png";
  }

  private generateEventCard(event: NewsletterEvent, newsletterPageUrl: string): string {
    const artistImage = this.getArtistImage(event);
    const hasVideo = event.artist_videolink && event.artist_videolink.trim() !== "";
    const artistName = event.artist_name || event.event_name;

    // Wrap event URL with Impact affiliate tracking for newsletter
    const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");

    return `
      <!-- EVENT CARD -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-collapse: collapse;">
        <tr>
          <!-- Square Image Column -->
          <td width="60%" valign="top" style="padding-right: 0; position: relative;">
            <div style="width: 100%; max-width: 300px; position: relative;">
              <img src="${artistImage}" alt="${artistName}" width="100%" style="display: block; border-radius: 8px;" />

              <!-- TEXT OVERLAY -->
              <div style="
                position: absolute;
                left: 8px;
                bottom: 8px;
                background: rgba(0,0,0,0.55);
                padding: 6px 10px;
                border-radius: 6px;
              ">
                <span style="color: #ffffff; font-size: 14px; font-weight: bold;">${artistName}</span><br/>
                <span style="color: #cccccc; font-size: 12px;">${event.venue_name}</span>
              </div>
            </div>
          </td>

          <!-- Buttons Column -->
          <td width="40%" valign="middle" style="padding-left: 16px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${affiliateUrl}" target="_blank" style="
                    display: inline-block;
                    padding: 12px 18px;
                    background: #000;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    width: 180px;
                    text-align: center;
                  ">
                    🎟️ Get Tickets
                  </a>
                </td>
              </tr>
              ${hasVideo ? `
              <tr>
                <td>
                  <a href="${event.artist_videolink}" target="_blank" style="
                    display: inline-block;
                    padding: 12px 18px;
                    background: #444;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    width: 180px;
                    text-align: center;
                  ">
                    ▶ Watch
                  </a>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  private generateEventsSection(title: string, emoji: string, events: NewsletterEvent[], newsletterPageUrl: string): string {
    if (events.length === 0) {
      return "";
    }

    const groupedByDate = this.groupEventsByDate(events);
    const sortedDates = Object.keys(groupedByDate).sort();

    let html = `
      <div style="margin-bottom: 40px;">
        <h2 style="margin: 0 0 24px 0; font-size: 28px; color: #1a1a1a; font-weight: bold;">
          ${emoji} ${title}
        </h2>
    `;

    sortedDates.forEach(date => {
      html += `
        <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #333333; font-weight: bold; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
          ${this.formatDate(date)}
        </h3>
        <div style="margin-bottom: 32px;">
          ${groupedByDate[date].map(event => this.generateEventCard(event, newsletterPageUrl)).join('')}
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  generateWeeklyEmailHTML(data: WeeklyEmailData): string {
    const { weekendEvents, nextWeekEvents, subscriberCity, unsubscribeUrl, subscriberEmail, newsletterPageUrl } = data;

    const cityFilter = subscriberCity ? `in ${subscriberCity}` : "";
    
    // Construct newsletter URL with city parameter
    const newsletterUrlWithCity = subscriberCity 
      ? `${newsletterPageUrl}?city=${encodeURIComponent(subscriberCity)}`
      : newsletterPageUrl;

    // FIX #2: If no city selected, limit to first day with events
    let displayWeekendEvents = weekendEvents;
    let displayNextWeekEvents = nextWeekEvents;
    let buttonText = "View All Events";
    
    if (!subscriberCity) {
      // Get first day with any events
      const allEvents = [...weekendEvents, ...nextWeekEvents];
      if (allEvents.length > 0) {
        const groupedByDate = this.groupEventsByDate(allEvents);
        const sortedDates = Object.keys(groupedByDate).sort();
        const firstDay = sortedDates[0];
        
        // Only show events from the first day
        const firstDayEvents = groupedByDate[firstDay];
        displayWeekendEvents = firstDayEvents.filter(e => weekendEvents.some(we => we.event_id === e.event_id));
        displayNextWeekEvents = firstDayEvents.filter(e => nextWeekEvents.some(nwe => nwe.event_id === e.event_id));
      }
      buttonText = "SELECT CITY TO SEE MORE EVENTS";
    }

    const weekendSection = this.generateEventsSection("This Weekend", "🎵", displayWeekendEvents, newsletterPageUrl);
    const nextWeekSection = this.generateEventsSection("Next Week", "📅", displayNextWeekEvents, newsletterPageUrl);

    // Different messaging for users with/without city
    const noCityMessage = !subscriberCity ? `
      <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          💡 <strong>Tip:</strong> Set your city in your preferences to receive personalized emails with only shows near you!
        </p>
      </div>
    ` : '';

    const totalDisplayedEvents = displayWeekendEvents.length + displayNextWeekEvents.length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTW LIVE - This Week's Shows</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
          img { display: block; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; max-width: 600px;">
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000;">
                    <img src="https://onestowatch.live/otwlive.png" alt="OTW Live" style="width: 100px; height: 100px; margin: 0 auto 16px auto; border-radius: 8px;" />
                  
                  
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    ${noCityMessage}
                    
                    ${totalDisplayedEvents === 0 ? `
                      <div style="text-align: center; padding: 40px 0;">
                        <p style="font-size: 18px; color: #666666; margin: 0 0 16px 0;">
                          No shows scheduled ${cityFilter} this week.
                        </p>
                        <p style="font-size: 14px; color: #999999; margin: 0 0 24px 0;">
                          Check back soon for new shows!
                        </p>
                        <a href="${newsletterUrlWithCity}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
                          View Newsletter
                        </a>
                      </div>
                    ` : `
                      ${weekendSection}
                      ${nextWeekSection}
                      
                      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <a href="${newsletterUrlWithCity}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-bottom: 12px;">
                          ${buttonText}
                        </a>
                        <p style="margin: 8px 0 0 0; color: #999999; font-size: 12px;">
                          ${subscriberCity ? "See all events in your city" : "Set your city to see personalized events"}
                        </p>
                      </div>
                    `}
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8f8f8; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      You're receiving this weekly newsletter because you subscribed to OTW LIVE.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <strong>Email:</strong> ${subscriberEmail}
                      ${subscriberCity ? `<br><strong>City:</strong> ${subscriberCity}` : `<br><em>No city set - <a href="${newsletterPageUrl}" style="color: #3b82f6;">Update your preferences</a></em>`}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a> | 
                      <a href="${newsletterPageUrl}" style="color: #666666; text-decoration: underline;">Update Preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateWeeklyEmailText(data: WeeklyEmailData): string {
    const { weekendEvents, nextWeekEvents, subscriberCity, unsubscribeUrl, subscriberEmail, newsletterPageUrl } = data;

    const cityFilter = subscriberCity ? `in ${subscriberCity}` : "";
    
    // Construct newsletter URL with city parameter
    const newsletterUrlWithCity = subscriberCity 
      ? `${newsletterPageUrl}?city=${encodeURIComponent(subscriberCity)}`
      : newsletterPageUrl;

    // FIX #2: If no city selected, limit to first day with events
    let displayWeekendEvents = weekendEvents;
    let displayNextWeekEvents = nextWeekEvents;
    let buttonText = "View All Events";
    
    if (!subscriberCity) {
      const allEvents = [...weekendEvents, ...nextWeekEvents];
      if (allEvents.length > 0) {
        const groupedByDate = this.groupEventsByDate(allEvents);
        const sortedDates = Object.keys(groupedByDate).sort();
        const firstDay = sortedDates[0];
        
        const firstDayEvents = groupedByDate[firstDay];
        displayWeekendEvents = firstDayEvents.filter(e => weekendEvents.some(we => we.event_id === e.event_id));
        displayNextWeekEvents = firstDayEvents.filter(e => nextWeekEvents.some(nwe => nwe.event_id === e.event_id));
      }
      buttonText = "SELECT CITY TO SEE MORE EVENTS";
    }

    const totalDisplayedEvents = displayWeekendEvents.length + displayNextWeekEvents.length;

    let text = `OTW LIVE This Week\n\n${totalDisplayedEvents} shows ${cityFilter} this week\n\n`;

    if (!subscriberCity) {
      text += `💡 TIP: Set your city to receive personalized emails with only shows near you!\n\n`;
    }

    if (totalDisplayedEvents === 0) {
      text += `No shows scheduled ${cityFilter} this week.\nCheck back soon for new shows!\n\nView Newsletter: ${newsletterUrlWithCity}\n`;
    } else {
      if (displayWeekendEvents.length > 0) {
        text += "🎵 THIS WEEKEND\n\n";
        const weekendGrouped = this.groupEventsByDate(displayWeekendEvents);
        Object.keys(weekendGrouped).sort().forEach(date => {
          text += `${this.formatDate(date)}\n`;
          weekendGrouped[date].forEach(event => {
            const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${affiliateUrl}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${event.artist_videolink}\n`;
            }
            text += `\n`;
          });
        });
      }

      if (displayNextWeekEvents.length > 0) {
        text += "\n📅 NEXT WEEK\n\n";
        const nextWeekGrouped = this.groupEventsByDate(displayNextWeekEvents);
        Object.keys(nextWeekGrouped).sort().forEach(date => {
          text += `${this.formatDate(date)}\n`;
          nextWeekGrouped[date].forEach(event => {
            const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${affiliateUrl}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${event.artist_videolink}\n`;
            }
            text += `\n`;
          });
        });
      }

      text += `\n${buttonText}: ${newsletterUrlWithCity}\n`;
    }

    text += `\n---\nYou're receiving this weekly newsletter because you subscribed to OTW LIVE.\n`;
    text += `Email: ${subscriberEmail}\n`;
    if (subscriberCity) {
      text += `City: ${subscriberCity}\n`;
    } else {
      text += `No city set - Update your preferences: ${newsletterPageUrl}\n`;
    }
    text += `\n`;
    text += `Unsubscribe: ${unsubscribeUrl}\n`;
    text += `Update Preferences: ${newsletterPageUrl}\n`;

    return text;
  }
}

export const weeklyEmailGenerator = new WeeklyEmailGenerator();
