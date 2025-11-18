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
    return "https://onestowatch.live/otwcolor-md6dlfkk.png";
  }

  private generateEventCard(event: NewsletterEvent, newsletterPageUrl: string): string {
    const artistImage = this.getArtistImage(event);
    const hasVideo = event.artist_videolink && event.artist_videolink.trim() !== "";
    const artistName = event.artist_name || event.event_name;

    // Wrap event URL with Impact affiliate tracking for newsletter
    const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");

    const playIconSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolygon points='10 8 16 12 10 16 10 8'%3E%3C/polygon%3E%3C/svg%3E`;
    const ticketIconSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z'%3E%3C/path%3E%3Cpath d='M13 5v2'%3E%3C/path%3E%3Cpath d='M13 17v2'%3E%3C/path%3E%3Cpath d='M13 11v2'%3E%3C/path%3E%3C/svg%3E`;

    return `
      <div style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="position: relative; padding: 0;">
              <div style="position: relative; width: 100%; padding-bottom: 100%; background-color: #000;">
                <img 
                  src="${artistImage}" 
                  alt="${artistName}"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                />
                
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%);"></div>
                
                <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 24px;">
                  <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 20px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    ${artistName}
                  </h3>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    ${event.venue_name}
                  </p>
                </div>
                
                <div style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%);">
                  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    ${hasVideo ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <a href="${newsletterPageUrl}" target="_blank" style="display: block; width: 48px; height: 48px; background-color: rgba(255,255,255,0.9); border-radius: 50%; text-align: center; line-height: 48px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                            <img src="${playIconSvg}" alt="Play" style="width: 24px; height: 24px; vertical-align: middle;" />
                          </a>
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td>
                        <a href="${affiliateUrl}" target="_blank" style="display: block; width: 48px; height: 48px; background-color: rgba(255,255,255,0.9); border-radius: 50%; text-align: center; line-height: 48px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                          <img src="${ticketIconSvg}" alt="Ticket" style="width: 24px; height: 24px; vertical-align: middle;" />
                        </a>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
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
    const totalEvents = weekendEvents.length + nextWeekEvents.length;

    const weekendSection = this.generateEventsSection("This Weekend", "🎵", weekendEvents, newsletterPageUrl);
    const nextWeekSection = this.generateEventsSection("Next Week", "🎟️", nextWeekEvents, newsletterPageUrl);

    // Different messaging for users with/without city
    const noCityMessage = !subscriberCity ? `
      <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px;">
          💡 <strong>Tip:</strong> Set your city in your preferences to receive personalized emails with only shows near you!
        </p>
      </div>
    ` : '';

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
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      OTW LIVE This Week
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #cccccc; font-size: 14px;">
                      ${totalEvents} shows ${cityFilter} this week
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px;">
                    ${noCityMessage}
                    
                    ${totalEvents === 0 ? `
                      <div style="text-align: center; padding: 40px 0;">
                        <p style="font-size: 18px; color: #666666; margin: 0 0 16px 0;">
                          No shows scheduled ${cityFilter} this week.
                        </p>
                        <p style="font-size: 14px; color: #999999; margin: 0 0 24px 0;">
                          Check back next week for new shows!
                        </p>
                        <a href="${newsletterPageUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
                          View All Shows
                        </a>
                      </div>
                    ` : `
                      ${weekendSection}
                      ${nextWeekSection}
                      
                      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <a href="${newsletterPageUrl}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          View Full Calendar
                        </a>
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
    const totalEvents = weekendEvents.length + nextWeekEvents.length;

    let text = `OTW LIVE This Week\n\n${totalEvents} shows ${cityFilter} this week\n\n`;

    if (!subscriberCity) {
      text += `💡 TIP: Set your city to receive personalized emails with only shows near you!\n\n`;
    }

    if (totalEvents === 0) {
      text += `No shows scheduled ${cityFilter} this week.\nCheck back next week for new shows!\n\nView All Shows: ${newsletterPageUrl}\n`;
    } else {
      if (weekendEvents.length > 0) {
        text += "🎵 THIS WEEKEND\n\n";
        const weekendGrouped = this.groupEventsByDate(weekendEvents);
        Object.keys(weekendGrouped).sort().forEach(date => {
          text += `${this.formatDate(date)}\n`;
          weekendGrouped[date].forEach(event => {
            const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${affiliateUrl}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${newsletterPageUrl}\n`;
            }
            text += `\n`;
          });
        });
      }

      if (nextWeekEvents.length > 0) {
        text += "\n🎟️ NEXT WEEK\n\n";
        const nextWeekGrouped = this.groupEventsByDate(nextWeekEvents);
        Object.keys(nextWeekGrouped).sort().forEach(date => {
          text += `${this.formatDate(date)}\n`;
          nextWeekGrouped[date].forEach(event => {
            const affiliateUrl = wrapWithImpactTracking(event.event_url, "newsletter");
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${affiliateUrl}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${newsletterPageUrl}\n`;
            }
            text += `\n`;
          });
        });
      }

      text += `\nView Full Calendar: ${newsletterPageUrl}\n`;
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