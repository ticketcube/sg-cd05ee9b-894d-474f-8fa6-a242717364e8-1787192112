// src/lib/posthog.ts
import posthog from 'posthog-js';

export const initPosthog = () => {
  if (typeof window !== 'undefined') {
    posthog.init('YOUR_PROJECT_API_KEY', {
      api_host: 'https://app.posthog.com',
      autocapture: true,              // auto-captures clicks, form fills
      capture_pageview: true,         // auto pageview tracking
      disable_session_recording: false, // record sessions for heatmaps
    });
  }
};

export default posthog;