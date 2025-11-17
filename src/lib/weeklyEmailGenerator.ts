import type { Database } from "@/integrations/supabase/types";

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

  private generateEventCard(event: NewsletterEvent): string {
    const artistImage = this.getArtistImage(event);
    const hasVideo = event.artist_videolink && event.artist_videolink.trim() !== "";
    const artistName = event.artist_name || event.event_name;

    return `
      <div style="margin-bottom: 24px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="position: relative; padding: 0;">
              <!-- Container for 16:9 aspect ratio -->
              <div style="position: relative; width: 100%; padding-bottom: 56.25%; background-color: #000;">
                <!-- Background Image -->
                <img 
                  src="${artistImage}" 
                  alt="${artistName}"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                />
                
                <!-- Dark Gradient Overlay -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%);"></div>
                
                <!-- Text Overlay - Lower Left -->
                <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 24px;">
                  <h3 style="margin: 0 0 8px 0; color: #ffffff; font-size: 20px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    ${artistName}
                  </h3>
                  <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    ${event.venue_name}
                  </p>
                </div>
                
                <!-- Action Buttons - Right Side -->
                <div style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%);">
                  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    ${hasVideo ? `
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <a href="${event.artist_videolink}" target="_blank" style="display: block; width: 48px; height: 48px; background-color: rgba(255,255,255,0.9); border-radius: 50%; text-align: center; line-height: 48px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                            <span style="color: #000000; font-size: 24px;">▶</span>
                          </a>
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td>
                        <a href="${event.event_url}" target="_blank" style="display: block; width: 48px; height: 48px; background-color: rgba(255,255,255,0.9); border-radius: 50%; text-align: center; line-height: 48px; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                          <span style="color: #000000; font-size: 20px;">🎫</span>
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

  private generateEventsSection(title: string, emoji: string, events: NewsletterEvent[]): string {
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
          ${groupedByDate[date].map(event => this.generateEventCard(event)).join('')}
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  generateWeeklyEmailHTML(data: WeeklyEmailData): string {
    const { weekendEvents, nextWeekEvents, subscriberCity, unsubscribeUrl, subscriberEmail } = data;

    const cityFilter = subscriberCity ? `in ${subscriberCity}` : "near you";
    const totalEvents = weekendEvents.length + nextWeekEvents.length;

    const weekendSection = this.generateEventsSection("This Weekend", "🎵", weekendEvents);
    const nextWeekSection = this.generateEventsSection("Next Week", "🎟️", nextWeekEvents);

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
                <!-- Header -->
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
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    ${totalEvents === 0 ? `
                      <div style="text-align: center; padding: 40px 0;">
                        <p style="font-size: 18px; color: #666666; margin: 0 0 16px 0;">
                          No shows scheduled ${cityFilter} this week.
                        </p>
                        <p style="font-size: 14px; color: #999999; margin: 0 0 24px 0;">
                          Check back next week for new shows!
                        </p>
                        <a href="https://onestowatch.live/newsletter" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
                          View All Shows
                        </a>
                      </div>
                    ` : `
                      ${weekendSection}
                      ${nextWeekSection}
                      
                      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <a href="https://onestowatch.live/newsletter" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                          View Full Calendar
                        </a>
                      </div>
                    `}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8f8f8; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      You're receiving this weekly newsletter because you subscribed to OTW LIVE.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <strong>Email:</strong> ${subscriberEmail}
                      ${subscriberCity ? `<br><strong>City:</strong> ${subscriberCity}` : ""}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a> | 
                      <a href="https://onestowatch.live/newsletter" style="color: #666666; text-decoration: underline;">Update Preferences</a>
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
    const { weekendEvents, nextWeekEvents, subscriberCity, unsubscribeUrl, subscriberEmail } = data;

    const cityFilter = subscriberCity ? `in ${subscriberCity}` : "near you";
    const totalEvents = weekendEvents.length + nextWeekEvents.length;

    let text = `OTW LIVE This Week\n\n${totalEvents} shows ${cityFilter} this week\n\n`;

    if (totalEvents === 0) {
      text += `No shows scheduled ${cityFilter} this week.\nCheck back next week for new shows!\n\nView All Shows: https://onestowatch.live/newsletter\n`;
    } else {
      if (weekendEvents.length > 0) {
        text += "🎵 THIS WEEKEND\n\n";
        const weekendGrouped = this.groupEventsByDate(weekendEvents);
        Object.keys(weekendGrouped).sort().forEach(date => {
          text += `${this.formatDate(date)}\n`;
          weekendGrouped[date].forEach(event => {
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${event.event_url}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${event.artist_videolink}\n`;
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
            text += `- ${event.artist_name || event.event_name}\n`;
            text += `  📍 ${event.venue_name}, ${event.venue_city}\n`;
            text += `  🕐 ${this.formatTime(event.event_time)}\n`;
            text += `  🎟️ ${event.event_url}\n`;
            if (event.artist_videolink) {
              text += `  ▶️ ${event.artist_videolink}\n`;
            }
            text += `\n`;
          });
        });
      }

      text += "\nView Full Calendar: https://onestowatch.live/newsletter\n";
    }

    text += `\n---\nYou're receiving this weekly newsletter because you subscribed to OTW LIVE.\n`;
    text += `Email: ${subscriberEmail}\n`;
    if (subscriberCity) {
      text += `City: ${subscriberCity}\n`;
    }
    text += `\nUnsubscribe: ${unsubscribeUrl}\n`;
    text += `Update Preferences: https://onestowatch.live/newsletter\n`;

    return text;
  }
}

export const weeklyEmailGenerator = new WeeklyEmailGenerator();
