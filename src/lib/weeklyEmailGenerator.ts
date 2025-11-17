
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

  private generateEventCard(event: NewsletterEvent): string {
    const artistImage = event.artist_image || "/otwlive.png";
    const time = this.formatTime(event.event_time);
    
    return `
      <div style="margin-bottom: 20px; padding: 16px; background-color: #f8f8f8; border-radius: 8px; border: 1px solid #e0e0e0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80" valign="top" style="padding-right: 16px;">
              <img src="${artistImage}" alt="${event.artist_name || event.event_name}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;" />
            </td>
            <td valign="top">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a; font-weight: bold;">
                ${event.artist_name || event.event_name}
              </h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #666666;">
                <strong>📍 ${event.venue_name}</strong>
              </p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #666666;">
                ${event.venue_city}${event.venue_state ? ", " + event.venue_state : ""}
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #666666;">
                🕐 ${time}
              </p>
              <a href="${event.event_url}" style="display: inline-block; padding: 8px 16px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">
                Get Tickets
              </a>
              ${event.artist_videolink ? `
                <a href="${event.artist_videolink}" style="display: inline-block; padding: 8px 16px; margin-left: 8px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold; border: 1px solid #000000;">
                  Watch Video
                </a>
              ` : ""}
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
        <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-weight: bold;">
          ${emoji} ${title}
        </h2>
    `;

    sortedDates.forEach(date => {
      html += `
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333333; font-weight: bold; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">
          ${this.formatDate(date)}
        </h3>
      `;
      groupedByDate[date].forEach(event => {
        html += this.generateEventCard(event);
      });
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
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #000000;">
                    <img src="https://onestowatch.live/otwlive.png" alt="OTW Live" style="width: 80px; height: 80px; margin-bottom: 16px;" />
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
                        <p style="font-size: 14px; color: #999999; margin: 0;">
                          Check back next week for new shows!
                        </p>
                        <div style="margin-top: 24px;">
                          <a href="https://onestowatch.live/newsletter" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold;">
                            View All Shows
                          </a>
                        </div>
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
            text += `  🎟️ ${event.event_url}\n\n`;
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
            text += `  🎟️ ${event.event_url}\n\n`;
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
