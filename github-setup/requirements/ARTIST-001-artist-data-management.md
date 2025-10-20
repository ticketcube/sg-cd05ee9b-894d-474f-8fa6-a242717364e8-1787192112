---
name: Feature Requirement
about: Artist Data Management
title: '[ARTIST-001] Artist Data Management'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-data']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** ARTIST-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** Data Management  
**Component:** Artist Database  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** Chartmetric API integration

---

## 📝 Feature Description

### Overview
Centralized artist data management system that stores artist profiles, metadata, videos, and engagement metrics. Integrates with Chartmetric API for artist data enrichment and YouTube for video content.

### User Story
**As a** content curator/admin  
**I want to** manage artist profiles and their associated content  
**So that** users can discover accurate, up-to-date artist information

### Business Value
- **Data Quality:** Accurate artist information improves user trust
- **Content Library:** Rich artist database enables discovery features
- **Integration Foundation:** Artist data powers weekly lists, recommendations
- **Scalability:** Centralized management supports growth
- **Analytics:** Track artist popularity and engagement

---

## ✅ Requirements

### Functional Requirements

#### Artist Profile Management
- [ ] **Artist Data Storage**
  - Store artist name, bio, genre(s)
  - Chartmetric ID (primary external identifier)
  - YouTube channel URL
  - Social media links (Instagram, TikTok, Twitter, Spotify)
  - Artist images (thumbnail, banner)
  - Location/origin (city, state, country)
  - Popularity metrics (followers, monthly listeners)

- [ ] **Artist CRUD Operations**
  - Create new artist profiles
  - Update existing artist information
  - Soft delete artists (mark as inactive)
  - Bulk import artists from CSV
  - Search artists by name, genre, location

- [ ] **Artist Lookup (Public)**
  - Search for artists by name
  - Display artist profile with all metadata
  - Show artist's videos and content
  - Display engagement stats (ratings, views)
  - Show upcoming events (from Ticketmaster)

#### Video Content Management
- [ ] **YouTube Video Integration**
  - Store YouTube video URLs for each artist
  - Support multiple videos per artist
  - Extract video metadata (title, duration, thumbnail)
  - Validate video URLs (ensure they exist and are playable)
  - Order videos (primary/featured video first)

- [ ] **Video CRUD Operations**
  - Add new videos to artist profile
  - Update video metadata
  - Remove videos from artist profile
  - Set primary/featured video
  - Bulk add videos via CSV or API

#### Chartmetric Integration
- [ ] **Artist Data Enrichment**
  - Fetch artist data from Chartmetric API
  - Auto-populate profile fields (bio, genres, images)
  - Sync social media follower counts
  - Update popularity metrics (weekly refresh)
  - Store Chartmetric ID as primary identifier

- [ ] **Genre Classification**
  - Fetch artist genres from Chartmetric
  - Support multiple genres per artist
  - Standardize genre names across sources
  - Allow manual genre override

#### Admin Portal Features
- [ ] **Artist Management Dashboard**
  - List all artists (paginated table)
  - Filter by genre, location, status
  - Sort by name, popularity, date added
  - Quick actions (edit, delete, view)
  - Bulk operations (activate, deactivate, export)

- [ ] **Artist Profile Editor**
  - Form-based editing interface
  - Image upload for thumbnails/banners
  - Video URL input with validation
  - Genre multi-select dropdown
  - Social links input fields
  - Preview before saving

- [ ] **Data Quality Tools**
  - Flag missing or incomplete profiles
  - Detect duplicate artists
  - Validate YouTube URLs
  - Check for broken image links
  - Audit log of changes

### Non-Functional Requirements

#### Performance
- [ ] **Artist Lookup:** < 500ms to load artist profile
- [ ] **Search Speed:** < 300ms to return search results
- [ ] **Bulk Import:** Process 100+ artists in < 10 seconds
- [ ] **API Caching:** Cache Chartmetric data for 24 hours

#### Data Quality
- [ ] **Completeness:** 95%+ of artists have all required fields
- [ ] **Accuracy:** Verified artist information (no fake profiles)
- [ ] **Freshness:** Popularity metrics updated weekly
- [ ] **Consistency:** Standardized data formats across sources

#### Scalability
- [ ] **Database Performance:** Support 10,000+ artists
- [ ] **Search Indexing:** Full-text search on artist names
- [ ] **Image Storage:** Optimize and compress artist images
- [ ] **API Rate Limits:** Respect Chartmetric API limits

---

## 🎨 User Interface Requirements

### Artist Lookup Page (Public)
```
┌─────────────────────────────────────────┐
│ Search Artists: [_________________] 🔍  │
├─────────────────────────────────────────┤
│ [Artist Image]  Artist Name             │
│                 📍 Origin City, ST      │
│                 🎸 Genre1, Genre2       │
│                 📊 50K followers        │
│                                         │
│ Bio: [Artist bio text...]              │
│                                         │
│ Videos:                                 │
│ [Video 1] [Video 2] [Video 3]          │
│                                         │
│ Upcoming Shows:                         │
│ • Nov 5 - Venue Name, City             │
│ • Nov 12 - Venue Name, City            │
│                                         │
│ Socials: [Instagram] [TikTok] [Spotify]│
└─────────────────────────────────────────┘
```

### Admin Artist Dashboard
```
┌──────────────────────────────────────────────┐
│ 🎸 Artist Management                         │
│ [+ Add Artist] [Import CSV] [Export]         │
│                                              │
│ Filters: [All Genres ▼] [All Locations ▼]  │
│ Search: [________________] 🔍               │
├──────────────────────────────────────────────┤
│ Name         | Genre    | Videos | Actions  │
│ Artist Name  | Rock     | 3      | Edit Del │
│ Artist Name  | Hip Hop  | 5      | Edit Del │
│ Artist Name  | Pop      | 2      | Edit Del │
│ ...                                          │
├──────────────────────────────────────────────┤
│ Showing 1-20 of 543 artists   < 1 2 3 4 5 > │
└──────────────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Artists table
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chartmetric_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  genres TEXT[] DEFAULT '{}',
  origin_city TEXT,
  origin_state TEXT,
  origin_country TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  youtube_channel_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  twitter_url TEXT,
  spotify_url TEXT,
  spotify_followers INTEGER DEFAULT 0,
  instagram_followers INTEGER DEFAULT 0,
  tiktok_followers INTEGER DEFAULT 0,
  monthly_listeners INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, inactive, draft
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist videos
CREATE TABLE artist_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  video_duration INTEGER, -- seconds
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artist engagement stats
CREATE TABLE artist_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  total_video_views INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id)
);

-- Indexes
CREATE INDEX idx_artists_name ON artists USING gin(to_tsvector('english', name));
CREATE INDEX idx_artists_genres ON artists USING gin(genres);
CREATE INDEX idx_artists_chartmetric ON artists(chartmetric_id);
CREATE INDEX idx_artist_videos_artist ON artist_videos(artist_id);

-- RLS Policies
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_videos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active artists"
  ON artists FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can view artist videos"
  ON artist_videos FOR SELECT
  USING (true);

-- Admin write access (handled by admin service role)
```

### Service Implementation
```typescript
// src/services/artistService.ts
export const artistService = {
  // Public API
  searchArtists: async (query: string) => { ... },
  getArtistById: async (artistId: string) => { ... },
  getArtistByChartmetricId: async (chartmetricId: string) => { ... },
  getArtistVideos: async (artistId: string) => { ... },
  getArtistEngagement: async (artistId: string) => { ... },
  
  // Admin API (service role)
  createArtist: async (artistData: ArtistData) => { ... },
  updateArtist: async (artistId: string, updates: Partial<ArtistData>) => { ... },
  deleteArtist: async (artistId: string) => { ... },
  bulkImportArtists: async (artists: ArtistData[]) => { ... },
  
  // Chartmetric Integration
  enrichArtistFromChartmetric: async (chartmetricId: string) => { ... },
  syncArtistMetrics: async (artistId: string) => { ... },
  
  // Video Management
  addVideo: async (artistId: string, videoUrl: string) => { ... },
  removeVideo: async (videoId: string) => { ... },
  setPrimaryVideo: async (videoId: string) => { ... }
};
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test artist CRUD operations
- [ ] Test search functionality
- [ ] Test Chartmetric API integration
- [ ] Test video URL validation
- [ ] Test genre normalization

### Integration Tests
- [ ] Test artist creation with Chartmetric enrichment
- [ ] Test bulk import from CSV
- [ ] Test video association with artists
- [ ] Test engagement stat calculations

### E2E Tests
- [ ] Admin can create new artist profile
- [ ] Admin can update artist information
- [ ] User can search for artists
- [ ] User can view artist profile with videos
- [ ] Chartmetric data syncs correctly

---

## 📊 Success Metrics

### Key Performance Indicators
- **Artist Database Size:** 500+ active artists by end of Phase 1
- **Data Completeness:** > 95% of artists have all required fields
- **Search Accuracy:** > 90% of searches return relevant results
- **Sync Success Rate:** > 99% Chartmetric syncs succeed

---

## 🚀 Implementation Plan

### Phase 1: Core Database (Week 1)
- Create database schema
- Implement basic CRUD operations
- Build artist search functionality

### Phase 2: Chartmetric Integration (Week 1-2)
- Integrate Chartmetric API
- Build data enrichment logic
- Implement metrics sync

### Phase 3: Admin Portal (Week 2-3)
- Build admin dashboard
- Create artist editor interface
- Implement bulk import feature

### Phase 4: Testing & Optimization (Week 3)
- Write comprehensive tests
- Optimize database queries
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- Chartmetric API access and API key
- YouTube Data API for video metadata

### Downstream Dependencies
- WEEKLY-001: Weekly lists require artist data
- VIDEO-001: Video viewing uses artist videos
- RATING-001: Rating system needs artist profiles
- EVENT-001: Event integration links to artists

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **API Rate Limits:** Mitigation: Cache data, batch requests
- **Data Quality:** Mitigation: Manual verification, data validation
- **Duplicate Artists:** Mitigation: Chartmetric ID as unique identifier

### Business Risks
- **Incomplete Profiles:** Mitigation: Required fields, validation
- **Outdated Data:** Mitigation: Automated weekly syncs

---

## ✏️ Notes

- Chartmetric ID is the source of truth for artist identity
- All artist images stored in Supabase Storage
- Soft deletes preserve historical data
- Genre taxonomy standardized across platform

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
