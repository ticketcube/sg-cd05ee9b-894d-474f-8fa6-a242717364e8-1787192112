// src/lib/posthog.ts
import posthog from 'posthog-js';

export const initPosthog = () => {
  if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    if (!apiKey) {
      console.warn('PostHog API key not found in environment variables');
      return;
    }

    try {
      posthog.init(apiKey, {
        api_host: apiHost || 'https://app.posthog.com',
        autocapture: true,              // auto-captures clicks, form fills
        capture_pageview: true,         // auto pageview tracking
        disable_session_recording: false, // record sessions for heatmaps
      });
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }
};

export default posthog;