// src/lib/posthog.js
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
    posthog.init('YOUR_PROJECT_API_KEY', {
        api_host: 'https://app.posthog.com',
        autocapture: true,              // auto-captures clicks, form fills
        capture_pageview: true,         // auto pageview tracking
        disable_session_recording: false, // record sessions for heatmaps
    });
}

export default posthog;