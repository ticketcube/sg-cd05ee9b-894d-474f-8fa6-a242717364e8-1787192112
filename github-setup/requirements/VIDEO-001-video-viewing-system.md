---
name: Feature Requirement
about: Video Viewing System
title: '[VIDEO-001] Video Viewing System'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-content']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** VIDEO-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** Content Delivery  
**Component:** Video Player  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** ARTIST-001 (Artist Data Management)

---

## 📝 Feature Description

### Overview
Embedded YouTube video player system for displaying artist performance videos. Tracks video views, completion rates, and integrates with the points system to reward engagement.

### User Story
**As a** user discovering new artists  
**I want to** watch short performance videos of each artist  
**So that** I can experience their music and decide if I like them

### Business Value
- **Engagement Foundation:** Video watching is the core discovery experience
- **Points Driver:** Video views earn points, driving retention
- **Ad Inventory:** Video content creates advertising opportunities
- **Data Collection:** View metrics inform artist popularity
- **Low Infrastructure Cost:** YouTube hosting eliminates video storage costs

---

## ✅ Requirements

### Functional Requirements

#### Video Player
- [ ] **YouTube Embed Integration**
  - Embed YouTube videos using iframe API
  - Responsive video player (16:9 aspect ratio)
  - Auto-play on artist page load (muted initially)
  - Volume controls visible
  - Fullscreen option available
  - Mobile-optimized player

- [ ] **Playback Controls**
  - Play/pause button
  - Volume slider
  - Progress bar (seeking enabled)
  - Current time / total duration display
  - Playback speed options (0.5x, 1x, 1.25x, 1.5x, 2x)
  - Picture-in-picture mode (if supported)

- [ ] **Video Queue**
  - If artist has multiple videos, show video thumbnails below player
  - Click thumbnail to switch videos
  - Auto-advance to next video after completion (optional)
  - "Up next" indicator for next video

#### View Tracking
- [ ] **View Counting**
  - Track when user starts watching (view count +1)
  - Track video completion percentage
  - Count as "watched" if > 80% viewed
  - Prevent duplicate counting (same user, same video, same session)
  - Store view timestamp

- [ ] **Engagement Metrics**
  - Track total watch time per user
  - Track completion rate (% of video watched)
  - Track drop-off points (where users stop watching)
  - Track unique viewers per video
  - Track replay counts

#### Points Integration
- [ ] **Video View Points**
  - Award 5 points for watching video (> 80% completion)
  - One-time points per video (no repeat points)
  - Display points earned notification after video completion
  - Track which videos user has earned points for
  - Prevent gaming (rate limiting, validation)

#### User Experience
- [ ] **Loading States**
  - Show loading spinner while video loads
  - Display video thumbnail before playback starts
  - Graceful error handling for failed video loads
  - Retry mechanism for failed loads

- [ ] **Video Information Display**
  - Show video title above/below player
  - Display artist name
  - Show view count and upload date
  - Link to full YouTube video (opens in new tab)

### Non-Functional Requirements

#### Performance
- [ ] **Video Load Time:** < 2 seconds to start playback
- [ ] **Smooth Playback:** No buffering on standard connections (3 Mbps+)
- [ ] **Mobile Performance:** Optimized for mobile data usage
- [ ] **Page Impact:** Video player doesn't slow down page load

#### Usability
- [ ] **Intuitive Controls:** Standard video player controls
- [ ] **Mobile Friendly:** Touch-optimized controls on mobile
- [ ] **Accessibility:** Keyboard navigation support, ARIA labels
- [ ] **Error Recovery:** Clear error messages, easy retry

#### Reliability
- [ ] **Uptime:** 99.9% video availability (dependent on YouTube)
- [ ] **Fallback:** If YouTube embed fails, show link to video
- [ ] **Cross-Browser:** Works in Chrome, Safari, Firefox, Edge
- [ ] **Cross-Device:** Works on desktop, mobile, tablet

---

## 🎨 User Interface Requirements

### Video Player Layout
```
┌─────────────────────────────────────────┐
│ 🎵 Artist Name - Video Title            │
├─────────────────────────────────────────┤
│                                         │
│         [  YouTube Video Player  ]      │
│         [   16:9 Aspect Ratio    ]      │
│         [   Embedded iframe      ]      │
│                                         │
├─────────────────────────────────────────┤
│ 👁️ 1,234 views | ⏱️ 3:45              │
│ [Watch on YouTube ↗]                   │
├─────────────────────────────────────────┤
│ More Videos:                            │
│ [Video 2 Thumb] [Video 3 Thumb]        │
└─────────────────────────────────────────┘
```

### Points Notification (After Video Completion)
```
┌─────────────────────────────────┐
│ ✅ Video Complete!              │
│                                 │
│ +5 points earned!               │
│                                 │
│ Total Points: 125               │
└─────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Technology Stack
- **Video Platform:** YouTube (iframe embed)
- **Player API:** YouTube IFrame Player API
- **React Component:** Custom VideoPlayer component
- **Tracking:** Supabase database for view metrics

### YouTube IFrame API Integration
```typescript
// Load YouTube IFrame API
<script src="https://www.youtube.com/iframe_api"></script>

// Player initialization
const player = new YT.Player('video-player', {
  videoId: 'VIDEO_ID',
  playerVars: {
    autoplay: 1,
    controls: 1,
    modestbranding: 1,
    rel: 0
  },
  events: {
    'onReady': onPlayerReady,
    'onStateChange': onPlayerStateChange
  }
});

// Track video progress
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    // Award points, track completion
  }
}
```

### Database Schema
```sql
-- Video views table
CREATE TABLE video_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES artist_videos(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  watch_duration INTEGER DEFAULT 0, -- seconds watched
  completion_percentage INTEGER DEFAULT 0, -- 0-100
  points_awarded BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id) -- One record per user per video
);

-- Video analytics (aggregated)
CREATE TABLE video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES artist_videos(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  average_completion_rate DECIMAL(5,2) DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- total seconds watched
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id)
);

-- Indexes
CREATE INDEX idx_video_views_user ON video_views(user_id);
CREATE INDEX idx_video_views_video ON video_views(video_id);
CREATE INDEX idx_video_views_artist ON video_views(artist_id);

-- RLS Policies
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video views"
  ON video_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video views"
  ON video_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Service Implementation
```typescript
// src/services/videoViewService.ts
export const videoViewService = {
  // Track video view start
  trackVideoView: async (userId: string, videoId: string, artistId: string) => { ... },
  
  // Update video progress
  updateVideoProgress: async (userId: string, videoId: string, duration: number, completion: number) => { ... },
  
  // Mark video as completed and award points
  completeVideo: async (userId: string, videoId: string) => { ... },
  
  // Check if user has watched video
  hasWatchedVideo: async (userId: string, videoId: string) => { ... },
  
  // Get user's watch history
  getUserWatchHistory: async (userId: string) => { ... },
  
  // Get video analytics
  getVideoAnalytics: async (videoId: string) => { ... }
};
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test video ID extraction from URL
- [ ] Test completion percentage calculation
- [ ] Test points award logic
- [ ] Test duplicate view prevention

### Integration Tests
- [ ] Test complete video watch flow
- [ ] Test points integration
- [ ] Test view tracking persistence
- [ ] Test analytics aggregation

### E2E Tests
- [ ] User can watch video
- [ ] User receives points after completion
- [ ] Video progress is saved
- [ ] User cannot earn points twice for same video
- [ ] Video player works on mobile

---

## 📊 Success Metrics

### Key Performance Indicators
- **Video Completion Rate:** > 70% of started videos are completed
- **Average Watch Time:** > 2 minutes per video
- **Replay Rate:** > 15% of videos are rewatched
- **Points Conversion:** > 90% of eligible users earn video points

---

## 🚀 Implementation Plan

### Phase 1: Basic Player (Week 1)
- Implement YouTube iframe embed
- Build VideoPlayer component
- Add basic playback controls
- Test on multiple devices

### Phase 2: Tracking & Points (Week 1-2)
- Implement view tracking
- Integrate with points system
- Build completion detection
- Add points notification

### Phase 3: Testing & Polish (Week 2)
- Write comprehensive tests
- Improve mobile experience
- Add error handling
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- ARTIST-001: Artist videos must exist in database
- POINTS-001: Points system must be configured

### Downstream Dependencies
- RATING-001: Video viewing precedes rating
- WEEKLY-001: Videos displayed in weekly lists

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **YouTube API Changes:** Mitigation: Monitor API updates, have fallback
- **Video Availability:** Mitigation: Validate videos periodically
- **Ad Blockers:** Mitigation: Detect and request whitelist

### UX Risks
- **Slow Load Times:** Mitigation: Optimize embed, show loading states
- **Mobile Data Usage:** Mitigation: Allow quality selection

---

## ✏️ Notes

- YouTube hosting eliminates need for video storage infrastructure
- Points only awarded once per video to prevent gaming
- All videos must be publicly available on YouTube
- Consider adding captions/subtitles support in future

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
