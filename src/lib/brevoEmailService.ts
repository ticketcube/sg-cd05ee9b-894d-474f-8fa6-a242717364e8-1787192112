const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "admin@onestowatch.live";
const SENDER_NAME = "OnesToWatch LIVE This Week";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo?: EmailRecipient;
}

class BrevoEmailService {
  private async sendRequest(payload: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY not configured");
      }

      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API error:", errorData);
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId
      };
    } catch (error) {
      console.error("Error sending email via Brevo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<{ success: boolean; error?: string }> {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://otwchart.com"}/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to OTW Live!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold;">
                      Welcome to OTW Live! 🎵
                    </h1>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Thank you for joining OnesToWatch LIVE!
                    </p>
                    
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      <strong>Here's what you'll receive every week:</strong>
                    </p>
                    
                    <ul style="margin: 0 0 20px 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                      <li>An exclusive list of OTW Artists' shows in cities near you</li>
                      <li>What's happening <strong>this weekend</strong></li>
                      <li>What's coming up <strong>this month</strong></li>
                      <li>Direct links to reserve tickets in just three clicks</li>
                    </ul>
                    
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Watch artist videos, discover new music, and never miss a show from the artists you love.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://onestowatch.live/newsletter" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                        View This Week's Shows
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8f8f8; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      You're receiving this because you subscribed to the OnesToWatch Discovery Club newsletter.
                    </p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <strong>Email:</strong> ${email}
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.6;">
                      <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
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

    const textContent = `
Welcome to OTW LIVE! 🎵

Thank you for joining OnesToWatch LIVE!

Here's what you'll receive every week:
- An exclusive list of OTW Artists' shows in cities near you
- What's happening this weekendv
- What's coming up this month
- Direct links to reserve tickets in just three clicks

Watch artist videos, discover new music, and never miss a show from the artists you love.

View this week's shows: https://onestowatch.live/newsletter

---
You're receiving this because you subscribed to the OnesToWatch LIVE newsletter.
Email: ${email}
Unsubscribe: ${unsubscribeUrl}
    `.trim();

    const payload = {
      sender: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      to: [{ email }],
      subject: "Welcome to OTW LIVE! 🎵",
      htmlContent,
      textContent
    };

    return this.sendRequest(payload);
  }

  async sendBulkEmail(
    recipients: EmailRecipient[],
    subject: string,
    htmlContent: string,
    textContent: string
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    const batchSize = 100;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        const result = await this.sendRequest({
          sender: {
            email: SENDER_EMAIL,
            name: SENDER_NAME
          },
          to: [{ email: recipient.email }],
          subject,
          htmlContent,
          textContent
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${recipient.email}: ${result.error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  async sendTestEmail(recipientEmail: string, subject: string, htmlContent: string, textContent: string): Promise<{ success: boolean; error?: string }> {
    const payload = {
      sender: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      to: [{ email: recipientEmail }],
      subject: `[TEST] ${subject}`,
      htmlContent,
      textContent
    };

    return this.sendRequest(payload);
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const payload = {
      sender: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      to: options.to,
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
      replyTo: options.replyTo
    };

    return this.sendRequest(payload);
  }
}

export const brevoEmailService = new BrevoEmailService();
