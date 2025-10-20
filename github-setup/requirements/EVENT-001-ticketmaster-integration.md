---
name: Feature Requirement
about: Ticketmaster Integration
title: '[EVENT-001] Ticketmaster Integration'
labels: ['requirement', 'priority-p1', 'phase-2', 'component-discovery']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** EVENT-001  
**Priority:** P1 - High  
**Phase:** Phase 2  
**Feature Area:** Artist Discovery & Events  
**Component:** Event Integration  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** ARTIST-001 (Artist Data Management), PROFILE-001 (User Profile with location)

---

## 📝 Feature Description

### Overview
Integration with Ticketmaster Discovery API to display upcoming concerts and events for featured artists. Shows events near user's location, allows filtering by date/location, and links directly to ticket purchase.

### User Story
**As a** user discovering new artists  
**I want to** see upcoming concerts and events for artists I'm interested in  
**So that** I can attend shows and support the artists I discover

### Business Value
- **Revenue Stream:** Affiliate commissions from Ticketmaster ticket sales
- **User Value:** Complete artist discovery → live experience funnel
- **Engagement:** Events create urgency and repeat visits
- **Partnerships:** Strengthens relationship with Ticketmaster
- **Data Collection:** Event attendance tracking for recommendations

---

## ✅ Requirements

### Functional Requirements

#### Event Data Fetching
- [ ] **Ticketmaster API Integration**
  - Connect to Ticketmaster Discovery API
  - Fetch events by artist name
  - Fetch events by location (city, lat/lon, radius)
  - Filter by date range
  - Include event details: venue, date, time, price range, ticket availability

- [ ] **Event Caching**
  - Cache event data for 24 hours
  - Refresh cache automatically
  - Manual refresh option for users
  - Background job to update popular artists' events

#### Event Display
- [ ] **Artist Event Cards**
  - Show on artist profile pages
  - Display event poster/image
  - Show venue name and location
  - Display date and time
  - Show price range
  - Link to Ticketmaster ticket purchase
  - Distance from user's location

- [ ] **Events Near Me**
  - Use user's saved location (from profile)
  - Show all upcoming events within 50-mile radius
  - Filter by genre (based on user's favorite artists)
  - Sort by: date, distance, relevance

- [ ] **Event Details View**
  - Full event information
  - Venue details and map
  - Artist lineup (if multi-artist event)
  - Ticket price tiers
  - Direct "Buy Tickets" CTA
  - Add to calendar functionality
  - Share event functionality

#### Location-Based Features
- [ ] **User Location**
  - Use location from user profile
  - Allow temporary location override ("Search near...")
  - Geolocation fallback (with permission)

- [ ] **Radius Search**
  - Default: 50 miles
  - Adjustable: 25, 50, 100, 250 miles
  - "Expand search" if no results found

#### Event Filtering & Sorting
- [ ] **Filters**
  - Date range (This week, This month, Next 3 months, Custom)
  - Price range ($, $$, $$$, $$$$)
  - Venue type (Outdoor, Indoor, Arena, Club)
  - Artist (from user's favorites)

- [ ] **Sort Options**
  - Soonest first
  - Closest first
  - Lowest price first
  - Most relevant (based on user's taste)

#### Ticketmaster Affiliate Integration
- [ ] **Tracking Links**
  - Generate affiliate tracking URLs
  - Track click-through rate
  - Track conversion (ticket purchases)
  - Commission reporting

### Non-Functional Requirements

#### Performance
- [ ] **Event Load Time:** < 1 second (from cache)
- [ ] **API Response:** < 2 seconds (fresh data)
- [ ] **Cache Hit Rate:** > 80%

#### Reliability
- [ ] **API Failure Handling:** Graceful degradation if Ticketmaster API down
- [ ] **Data Freshness:** Events updated daily minimum
- [ ] **Availability:** 99.5% uptime for event display

#### Scalability
- [ ] **Rate Limiting:** Respect Ticketmaster API rate limits
- [ ] **Caching Strategy:** Efficient caching to reduce API calls
- [ ] **Background Jobs:** Process event updates asynchronously

---

## 🎨 User Interface Requirements

### Artist Profile Events Section
```
┌────────────────────────────────────────┐
│ 🎫 Upcoming Events                     │
│ [Refresh Events]                       │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ [Event Poster]     Nov 15, 2025  │  │
│ │                    The Fillmore   │  │
│ │                    San Francisco  │  │
│ │                    8:00 PM        │  │
│ │                    $45-$125       │  │
│ │                    [Buy Tickets →]│  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ [Event Poster]     Dec 3, 2025   │  │
│ │                    The Warfield   │  │
│ │                    San Francisco  │  │
│ │                    7:30 PM        │  │
│ │                    $55-$150       │  │
│ │                    [Buy Tickets →]│  │
│ └──────────────────────────────────┘  │
│                                        │
│ [View All Events]                      │
└────────────────────────────────────────┘
```

### Events Near Me Page
```
┌────────────────────────────────────────┐
│ 🎫 Events Near San Francisco           │
│ [Change Location ▼]  [Radius: 50mi ▼] │
├────────────────────────────────────────┤
│ Filters: [Date ▼] [Price ▼] [Genre ▼] │
│ Sort: [Soonest ▼]                      │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ Oct 25 • 8:00 PM                 │  │
│ │ [Event Image]  Artist Name       │  │
│ │                The Fillmore      │  │
│ │                3.2 mi away       │  │
│ │                $45-$125          │  │
│ │                [Buy Tickets]     │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Oct 28 • 7:30 PM                 │  │
│ │ [Event Image]  Artist Name       │  │
│ │                The Warfield      │  │
│ │                2.8 mi away       │  │
│ │                $55-$150          │  │
│ │                [Buy Tickets]     │  │
│ └──────────────────────────────────┘  │
│ ...                                    │
└────────────────────────────────────────┘
```

### Event Detail Modal
```
┌────────────────────────────────────────┐
│                                     [✕]│
│ [Large Event Poster]                   │
│                                        │
│ Artist Name                            │
│ Supporting Act                         │
│                                        │
│ 📅 Friday, November 15, 2025          │
│ 🕐 Doors: 7:00 PM • Show: 8:00 PM    │
│ 📍 The Fillmore                       │
│    1805 Geary Blvd, San Francisco     │
│    [View on Map]                       │
│                                        │
│ 💰 Ticket Prices                      │
│    General Admission: $45-$75         │
│    VIP: $125                          │
│                                        │
│ [🎟️ Buy Tickets on Ticketmaster]     │
│                                        │
│ [📅 Add to Calendar] [🔗 Share]       │
└────────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Event cache
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticketmaster_id TEXT UNIQUE NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_city TEXT NOT NULL,
  venue_state TEXT,
  venue_country TEXT NOT NULL,
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  event_date TIMESTAMPTZ NOT NULL,
  doors_open_time TIME,
  event_url TEXT NOT NULL,
  image_url TEXT,
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  price_currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'onsale', -- onsale, offsale, cancelled
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Event click tracking (for affiliate analytics)
CREATE TABLE event_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticketmaster_url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_artist ON events(artist_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_location ON events(venue_city, venue_state);
CREATE INDEX idx_events_expiry ON events(expires_at);
CREATE INDEX idx_events_coordinates ON events(venue_latitude, venue_longitude);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (expires_at > NOW() AND event_date > NOW());
```

### API Service
```typescript
// src/services/ticketmasterService.ts
export const ticketmasterService = {
  // Fetch events for specific artist
  getArtistEvents: async (artistName: string) => {
    // Check cache first
    // If expired, fetch from Ticketmaster API
    // Update cache
    // Return events
  },
  
  // Fetch events near location
  getEventsNearLocation: async (
    latitude: number,
    longitude: number,
    radiusMiles: number = 50
  ) => {
    // Query cached events within radius
    // If insufficient results, fetch from Ticketmaster
    // Return sorted by distance
  },
  
  // Search events by filters
  searchEvents: async (filters: EventFilters) => {
    // Apply filters to cached events
    // Return filtered and sorted results
  },
  
  // Get single event details
  getEventDetails: async (eventId: string) => {
    // Fetch from cache or Ticketmaster
    // Return full event details
  },
  
  // Track affiliate click
  trackEventClick: async (userId: string, eventId: string, ticketmasterUrl: string) => {
    // Record click for analytics
    // Return tracking URL with affiliate code
  },
  
  // Background job: Refresh event cache
  refreshEventCache: async () => {
    // Get list of popular artists
    // Fetch latest events for each
    // Update cache
  },
  
  // Admin: Force refresh for specific artist
  forceRefreshArtist: async (artistId: string) => {
    // Clear cache for artist
    // Fetch fresh data
    // Update cache
  }
};
```

### Ticketmaster API Integration
```typescript
// src/lib/ticketmaster.ts
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export async function fetchArtistEvents(artistName: string) {
  const response = await fetch(
    `${BASE_URL}/events.json?keyword=${encodeURIComponent(artistName)}&apikey=${TICKETMASTER_API_KEY}`
  );
  
  if (!response.ok) throw new Error('Ticketmaster API error');
  
  const data = await response.json();
  return data._embedded?.events || [];
}

export async function fetchEventsByLocation(
  lat: number,
  lon: number,
  radius: number
) {
  const response = await fetch(
    `${BASE_URL}/events.json?latlong=${lat},${lon}&radius=${radius}&unit=miles&apikey=${TICKETMASTER_API_KEY}`
  );
  
  if (!response.ok) throw new Error('Ticketmaster API error');
  
  const data = await response.json();
  return data._embedded?.events || [];
}
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test event cache logic
- [ ] Test distance calculation
- [ ] Test filtering logic
- [ ] Test affiliate URL generation

### Integration Tests
- [ ] Test Ticketmaster API integration
- [ ] Test cache expiration and refresh
- [ ] Test location-based search
- [ ] Test click tracking

### E2E Tests
- [ ] User can view artist events
- [ ] User can search events near location
- [ ] User can filter events
- [ ] User can click through to Ticketmaster
- [ ] Affiliate tracking works correctly

---

## 📊 Success Metrics

### Key Performance Indicators
- **Click-Through Rate:** > 5% of event views result in clicks
- **Conversion Rate:** > 1% of clicks result in ticket purchases
- **Event Discovery:** > 30% of users explore events feature
- **Revenue:** Track affiliate commissions

---

## 🚀 Implementation Plan

### Phase 1: API Integration (Week 1)
- Set up Ticketmaster API credentials
- Build API service layer
- Implement caching strategy
- Create background refresh job

### Phase 2: Event Display (Week 1-2)
- Build event card components
- Create artist events section
- Implement events near me page
- Add event detail modal

### Phase 3: Filtering & Search (Week 2)
- Implement location-based search
- Add filtering options
- Build sorting functionality
- Add map view (optional)

### Phase 4: Affiliate Integration (Week 2-3)
- Implement affiliate tracking
- Add analytics dashboard
- Test conversion tracking
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- ARTIST-001: Artist data for event matching
- PROFILE-001: User location for personalized events

### Downstream Dependencies
- None

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **API Rate Limits:** Mitigation: Aggressive caching, background updates
- **API Downtime:** Mitigation: Graceful degradation, cached data
- **Data Accuracy:** Mitigation: Regular cache refresh, user feedback

### Business Risks
- **Low Conversion:** Mitigation: A/B test CTAs, optimize placement
- **Commission Changes:** Mitigation: Monitor affiliate program terms

---

## ✏️ Notes

- Ticketmaster API requires approval and API key
- Consider expanding to other ticketing platforms (Eventbrite, Dice)
- Map integration could enhance user experience
- Event attendance tracking could improve recommendations

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
