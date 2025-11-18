/**
 * Impact Affiliate Tracking Utility
 * 
 * Wraps Ticketmaster URLs with Impact affiliate tracking parameters
 * 
 * @example
 * const affiliateUrl = wrapWithImpactTracking(
 *   "https://www.ticketmaster.com/event/3A0060C9F0DA3A1A",
 *   "newsletter"
 * );
 * // Returns: https://ticketmaster.evyy.net/c/6581772/264167/4272?subId1=otwl&subId2=newsletter&u=https%3A%2F%2Fwww.ticketmaster.com%2Fevent%2F3A0060C9F0DA3A1A
 */

// Impact affiliate tracking configuration
const IMPACT_CONFIG = {
  baseUrl: "https://ticketmaster.evyy.net/c/6581772/264167/4272",
  subId1: "otwl", // OTW Live identifier
  partnerPropertyId: "7517906",
  mediaPartnerPropertyId: "7517906",
} as const;

type TrackingSource = "newsletter" | "website";

/**
 * Wraps a Ticketmaster URL with Impact affiliate tracking parameters
 * 
 * @param ticketmasterUrl - The original Ticketmaster event URL
 * @param source - The source of the click (newsletter or website)
 * @returns The wrapped Impact affiliate tracking URL
 */
export function wrapWithImpactTracking(
  ticketmasterUrl: string,
  source: TrackingSource = "website"
): string {
  // Validate input
  if (!ticketmasterUrl || typeof ticketmasterUrl !== "string") {
    console.warn("Invalid Ticketmaster URL provided to wrapWithImpactTracking");
    return ticketmasterUrl || "";
  }

  // If the URL is already wrapped with Impact tracking, return as-is
  if (ticketmasterUrl.includes("ticketmaster.evyy.net")) {
    return ticketmasterUrl;
  }

  try {
    // URL encode the Ticketmaster destination URL
    const encodedUrl = encodeURIComponent(ticketmasterUrl);

    // Build the Impact tracking URL with all required parameters
    const impactUrl = new URL(IMPACT_CONFIG.baseUrl);
    impactUrl.searchParams.set("subId1", IMPACT_CONFIG.subId1);
    impactUrl.searchParams.set("subId2", source);
    impactUrl.searchParams.set("partnerpropertyid", IMPACT_CONFIG.partnerPropertyId);
    impactUrl.searchParams.set("MediaPartnerPropertyId", IMPACT_CONFIG.mediaPartnerPropertyId);
    impactUrl.searchParams.set("u", encodedUrl);

    return impactUrl.toString();
  } catch (error) {
    console.error("Error wrapping URL with Impact tracking:", error);
    // Fallback to original URL if something goes wrong
    return ticketmasterUrl;
  }
}

/**
 * Helper to check if a URL is already wrapped with Impact tracking
 */
export function isImpactTrackedUrl(url: string): boolean {
  return url.includes("ticketmaster.evyy.net");
}
