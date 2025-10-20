---
name: Feature Requirement
about: Artist Rating System
title: '[RATING-001] Artist Rating System'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-engagement']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** RATING-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** User Engagement  
**Component:** Rating System  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** VIDEO-001 (Video Viewing System), ARTIST-001 (Artist Data Management)

---

## 📝 Feature Description

### Overview
5-star rating system for users to rate artists after watching their videos. Ratings inform weekly list progression, earn points, and provide valuable data for artist recommendations and analytics.

### User Story
**As a** user who just watched an artist's video  
**I want to** rate the artist on a 1-5 star scale  
**So that** I can express my opinion and unlock the next artist in the weekly list

### Business Value
- **Engagement Metric:** Ratings indicate genuine interest vs. passive viewing
- **Progression Gate:** Ratings required to advance in weekly lists
- **Points Driver:** Each rating earns points, incentivizing engagement
- **Data Value:** Rating data powers recommendations and artist analytics
- **Artist Feedback:** Aggregate ratings help artists understand audience reception

---

## ✅ Requirements

### Functional Requirements

#### Rating Submission
- [ ] **5-Star Rating Interface**
  - Display 5 clickable stars
  - Hover preview (fill stars on hover)
  - Click to submit rating (1-5 stars)
  - Visual feedback on selection (filled stars)
  - Confirmation after submission
  - Option to change rating (within same session)

- [ ] **Rating Requirements**
  - User must be logged in to rate
  - User must watch >50% of video before rating unlocks
  - Rating locks after submission (cannot delete, only change)
  - One rating per user per artist
  - Rating submission advances weekly list progress

- [ ] **Rating Display**
  - Show user's rating after submission
  - Display average rating for artist (aggregate)
  - Show total number of ratings
  - Rating stars visible throughout app (artist cards, profiles)

#### Points Integration
- [ ] **Rating Points**
  - Award 5 points per artist rating
  - One-time points per artist (no repeat points)
  - Display points earned notification after rating
  - Track which artists user has rated for points

#### Rating Data
- [ ] **User Rating History**
  - Store all user ratings with timestamps
  - Allow viewing of past ratings in profile
  - Track rating changes (if user updates rating)
  - Export user ratings (data portability)

- [ ] **Artist Rating Aggregation**
  - Calculate average rating (mean)
  - Count total ratings
  - Track rating distribution (how many 1-star, 2-star, etc.)
  - Update aggregates in real-time

#### Quadrant System (Optional Enhancement)
- [ ] **Vibes vs. Authenticity Quadrant**
  - 2D rating system (X-axis: Vibes, Y-axis: Authenticity)
  - Each axis rated 1-5
  - Plot artist on quadrant chart
  - Aggregate user quadrant ratings
  - Display quadrant position on artist profile

### Non-Functional Requirements

#### Performance
- [ ] **Rating Submission:** < 200ms to save rating
- [ ] **Aggregation Update:** Real-time update of average rating
- [ ] **Rating Display:** < 100ms to load user's past ratings

#### Usability
- [ ] **Intuitive Interface:** Stars are universally understood
- [ ] **Clear Feedback:** Immediate visual confirmation of rating
- [ ] **Easy to Change:** Allow rating updates if user changes mind
- [ ] **Mobile Optimized:** Touch-friendly star selection

#### Reliability
- [ ] **Data Integrity:** Ratings cannot be deleted or lost
- [ ] **Duplicate Prevention:** No duplicate ratings per user
- [ ] **Accurate Aggregation:** Average ratings are mathematically correct

---

## 🎨 User Interface Requirements

### Rating Component (After Video)
```
┌─────────────────────────────────────┐
│ How would you rate this artist?     │
│                                     │
│     ★ ★ ★ ★ ★                       │
│   (Click to rate 1-5 stars)        │
│                                     │
│ [Submit Rating]                     │
└─────────────────────────────────────┘
```

### Rating Confirmation
```
┌─────────────────────────────────┐
│ ✅ Rating Saved!                │
│                                 │
│ You rated Artist Name: ★★★★☆   │
│                                 │
│ +5 points earned!               │
│                                 │
│ [Next Artist →]                 │
└─────────────────────────────────┘
```

### Artist Card with Rating
```
┌─────────────────────────────┐
│ [Artist Thumbnail]          │
│ Artist Name                 │
│ ★★★★☆ 4.2 (156 ratings)    │
│ [Watch & Rate]              │
└─────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Artist ratings table
CREATE TABLE artist_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  vibes_rating INTEGER CHECK (vibes_rating >= 1 AND vibes_rating <= 5), -- Optional quadrant
  authenticity_rating INTEGER CHECK (authenticity_rating >= 1 AND authenticity_rating <= 5), -- Optional quadrant
  points_awarded BOOLEAN DEFAULT false,
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id) -- One rating per user per artist
);

-- Rating analytics (aggregated)
CREATE TABLE artist_rating_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}', -- Count of each rating
  average_vibes DECIMAL(3,2) DEFAULT 0,
  average_authenticity DECIMAL(3,2) DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id)
);

-- Indexes
CREATE INDEX idx_ratings_user ON artist_ratings(user_id);
CREATE INDEX idx_ratings_artist ON artist_ratings(artist_id);
CREATE INDEX idx_ratings_date ON artist_ratings(rated_at);

-- RLS Policies
ALTER TABLE artist_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
  ON artist_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON artist_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON artist_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can view rating analytics
CREATE POLICY "Anyone can view rating analytics"
  ON artist_rating_analytics FOR SELECT
  USING (true);
```

### Service Implementation
```typescript
// src/services/artistRatingService.ts
export const artistRatingService = {
  // Submit or update rating
  rateArtist: async (userId: string, artistId: string, rating: number) => { ... },
  
  // Submit quadrant rating (optional)
  rateArtistQuadrant: async (userId: string, artistId: string, vibes: number, authenticity: number) => { ... },
  
  // Get user's rating for artist
  getUserRating: async (userId: string, artistId: string) => { ... },
  
  // Get user's all ratings
  getUserRatingHistory: async (userId: string) => { ... },
  
  // Get artist rating analytics
  getArtistRatingAnalytics: async (artistId: string) => { ... },
  
  // Calculate and update rating aggregates
  updateRatingAggregates: async (artistId: string) => { ... },
  
  // Check if user has rated artist
  hasRatedArtist: async (userId: string, artistId: string) => { ... }
};
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test rating validation (1-5 range)
- [ ] Test rating aggregation calculation
- [ ] Test duplicate rating prevention
- [ ] Test points award logic

### Integration Tests
- [ ] Test complete rating flow
- [ ] Test rating update functionality
- [ ] Test points integration
- [ ] Test rating analytics updates

### E2E Tests
- [ ] User can rate artist after watching video
- [ ] User receives points after rating
- [ ] User cannot rate same artist twice (without update)
- [ ] Average rating updates correctly
- [ ] Rating unlocks next artist in weekly list

---

## 📊 Success Metrics

### Key Performance Indicators
- **Rating Conversion Rate:** > 85% of video viewers submit rating
- **Average Rating:** 3.5-4.5 stars (indicates quality content)
- **Rating Distribution:** Bell curve centered around 4 stars
- **Time to Rate:** < 30 seconds from video end to rating submission

---

## 🚀 Implementation Plan

### Phase 1: Basic Rating (Week 1)
- Create database schema
- Build star rating component
- Implement rating submission
- Integrate with points system

### Phase 2: Analytics & Display (Week 1-2)
- Build rating aggregation logic
- Display average ratings
- Create user rating history view
- Test rating updates

### Phase 3: Testing & Polish (Week 2)
- Write comprehensive tests
- Improve mobile UX
- Add animations
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- VIDEO-001: Video viewing enables rating
- ARTIST-001: Artist profiles store ratings
- POINTS-001: Points awarded for ratings

### Downstream Dependencies
- WEEKLY-001: Ratings advance weekly list progress
- DASHBOARD-001: Rating stats displayed on dashboard

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **Rating Spam:** Mitigation: Require video watch >50%, rate limiting
- **Aggregation Performance:** Mitigation: Cache aggregates, update async

### UX Risks
- **Low Rating Rates:** Mitigation: Make rating prominent, require for progression
- **Biased Ratings:** Mitigation: Encourage honest ratings, no incentives for high ratings

---

## ✏️ Notes

- Ratings are required to advance in weekly lists
- Points only awarded once per artist
- Rating changes allowed but don't earn additional points
- Average ratings visible to encourage quality content

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
