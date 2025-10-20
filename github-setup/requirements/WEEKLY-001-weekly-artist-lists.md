---
name: Feature Requirement
about: Weekly Artist Lists
title: '[WEEKLY-001] Weekly Artist Lists'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-content']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** WEEKLY-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** Content Discovery  
**Component:** Weekly Lists  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** ARTIST-001 (Artist Data Management), PROFILE-001 (User Profile System)

---

## 📝 Feature Description

### Overview
Curated weekly lists of 10 emerging artists for users to discover. Lists are personalized based on user location, genre preferences, and engagement history. Users progress through the list sequentially, watching videos and rating each artist.

### User Story
**As a** music enthusiast  
**I want to** discover a weekly curated list of 10 new artists  
**So that** I can find emerging talent and earn points for my engagement

### Business Value
- **Engagement Driver:** Weekly cadence creates habit-forming behavior
- **Content Structure:** Organized discovery experience vs. random browsing
- **Points System Foundation:** Lists are the core activity for earning points
- **Personalization:** Location and genre-based curation improves relevance
- **Data Collection:** User ratings provide valuable artist preference data

---

## ✅ Requirements

### Functional Requirements

#### Weekly List Generation
- [ ] **List Creation (Admin)**
  - Staff can create new weekly lists via admin portal
  - Select 10 artists from database
  - Set list publish date (always Monday at 12:00 AM)
  - Set list end date (following Sunday at 11:59 PM)
  - Preview list before publishing
  - Save as draft or publish immediately

- [ ] **List Curation Logic**
  - Prioritize artists with upcoming shows in user's location
  - Factor in user's favorite genres
  - Avoid repeating artists from previous 4 weeks
  - Mix of genres (balanced distribution)
  - Include mix of popularity levels (emerging focus)

- [ ] **Active List Management**
  - Only one active list per week
  - New list automatically goes live Monday 12:00 AM
  - Previous list archived (still viewable in history)
  - System prevents gaps (no week without a list)

#### User List Experience
- [ ] **List Viewing**
  - Display current week's list on homepage/dashboard
  - Show list title and week number (e.g., "Week 42 - October 2025")
  - Display progress indicator (e.g., "3/10 artists rated")
  - Show artist thumbnails in sequential order
  - Indicate current position in list
  - Show completion status (in progress / completed)

- [ ] **Sequential Navigation**
  - Users must rate artists in order (1 → 2 → 3 ... → 10)
  - Cannot skip ahead to later artists
  - Can go back to previously rated artists
  - Next artist unlocks after current rating submitted
  - Visual lock icon on future artists

- [ ] **Artist Cards in List**
  - Artist thumbnail image
  - Artist name
  - Genre tag(s)
  - "Watch & Rate" button (for current artist)
  - "Rated ✓" indicator (for completed artists)
  - "Locked 🔒" indicator (for future artists)

#### List Completion & Rewards
- [ ] **Completion Tracking**
  - Track individual artist completion (rated = completed)
  - Track overall list completion (all 10 artists rated)
  - Store completion timestamp
  - Calculate time to complete list (analytics)

- [ ] **Completion Bonus**
  - Award 15 bonus points for completing full list
  - Display completion celebration modal
  - Show total points earned for the week
  - Encourage social sharing of completion

- [ ] **List History**
  - View previously completed lists
  - See past ratings and artists discovered
  - Revisit artist videos from past weeks
  - Display completion dates and points earned

### Non-Functional Requirements

#### Performance
- [ ] **List Load Time:** < 1 second to load weekly list
- [ ] **Navigation Speed:** < 200ms to move between artists
- [ ] **Image Loading:** Lazy load artist thumbnails for performance

#### Usability
- [ ] **Clear Progress:** Visual progress indicator always visible
- [ ] **Mobile Optimized:** Swipe navigation on mobile devices
- [ ] **Intuitive Flow:** Sequential order is obvious and natural
- [ ] **Completion Clarity:** Clear indication when list is complete

#### Reliability
- [ ] **No Duplicate Artists:** Same artist never appears twice in one list
- [ ] **No Broken Lists:** System ensures lists always have 10 valid artists
- [ ] **Fallback Content:** If no custom list, generate from database

---

## 🎨 User Interface Requirements

### Weekly List Display (Homepage/Dashboard)
```
┌─────────────────────────────────────────────┐
│ 🎵 Week 42 - Discover New Artists           │
│ Progress: 3/10 artists rated ████░░░░░░░    │
├─────────────────────────────────────────────┤
│ [✓ Artist 1]  [✓ Artist 2]  [▶ Artist 3]   │
│ [🔒 Artist 4] [🔒 Artist 5] [🔒 Artist 6]   │
│ [🔒 Artist 7] [🔒 Artist 8] [🔒 Artist 9]   │
│ [🔒 Artist 10]                              │
│                                             │
│ Earn 5 points per artist + 15 bonus!       │
└─────────────────────────────────────────────┘
```

### Artist Card States
**Current Artist (Active):**
- Full color thumbnail
- Artist name + genre
- Glowing border or highlight
- "Watch & Rate" button (prominent CTA)

**Completed Artist:**
- Full color thumbnail
- Green checkmark overlay
- Rating stars visible
- "View Again" option

**Locked Artist:**
- Grayscale or darkened thumbnail
- Lock icon overlay
- Artist name visible (teaser)
- No interaction possible

### Completion Modal
```
┌─────────────────────────────────────┐
│   🎉 Week 42 Complete! 🎉           │
│                                     │
│   You discovered 10 new artists!    │
│                                     │
│   Points Earned:                    │
│   • Artist Ratings: 50 points      │
│   • Completion Bonus: 15 points    │
│   • Total: 65 points                │
│                                     │
│   [Share Your Discovery]            │
│   [View Next Week's List]           │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Weekly lists table
CREATE TABLE weekly_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, archived
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_number, start_date)
);

-- Artists in weekly lists (join table)
CREATE TABLE weekly_list_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_list_id UUID NOT NULL REFERENCES weekly_lists(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL, -- Chartmetric ID
  position INTEGER NOT NULL, -- 1-10 (order in list)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(weekly_list_id, position),
  UNIQUE(weekly_list_id, artist_id)
);

-- User progress on weekly lists
CREATE TABLE user_weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekly_list_id UUID NOT NULL REFERENCES weekly_lists(id) ON DELETE CASCADE,
  current_position INTEGER DEFAULT 1, -- Which artist they're on (1-10)
  completed_at TIMESTAMPTZ, -- NULL if not completed
  completion_bonus_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, weekly_list_id)
);

-- Indexes
CREATE INDEX idx_weekly_lists_status ON weekly_lists(status);
CREATE INDEX idx_weekly_lists_dates ON weekly_lists(start_date, end_date);
CREATE INDEX idx_user_progress_user ON user_weekly_progress(user_id);
CREATE INDEX idx_user_progress_list ON user_weekly_progress(weekly_list_id);

-- RLS Policies
ALTER TABLE weekly_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_list_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_progress ENABLE ROW LEVEL SECURITY;

-- Everyone can view active lists
CREATE POLICY "Anyone can view active lists"
  ON weekly_lists FOR SELECT
  USING (status = 'active');

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
  ON user_weekly_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_weekly_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### Service Implementation
```typescript
// src/services/weeklyListService.ts
export const weeklyListService = {
  // Get active weekly list
  getActiveList: async () => { ... },
  
  // Get weekly list by ID
  getListById: async (listId: string) => { ... },
  
  // Get artists in list (ordered by position)
  getListArtists: async (listId: string) => { ... },
  
  // Get user's progress on current list
  getUserProgress: async (userId: string, listId: string) => { ... },
  
  // Update user's progress (advance to next artist)
  advanceProgress: async (userId: string, listId: string) => { ... },
  
  // Mark list as completed and award bonus
  completeList: async (userId: string, listId: string) => { ... },
  
  // Get user's list history (completed lists)
  getUserListHistory: async (userId: string) => { ... },
  
  // Admin: Create new weekly list
  createList: async (title: string, artistIds: string[], startDate: Date) => { ... },
  
  // Admin: Activate list (set status to 'active')
  activateList: async (listId: string) => { ... }
};
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test list generation logic
- [ ] Test sequential navigation rules
- [ ] Test completion detection
- [ ] Test bonus points calculation
- [ ] Test list archival logic

### Integration Tests
- [ ] Test complete user flow through list
- [ ] Test progress persistence across sessions
- [ ] Test completion bonus award
- [ ] Test list transition (old → new week)
- [ ] Test list history retrieval

### E2E Tests
- [ ] User can view active weekly list
- [ ] User can navigate through artists sequentially
- [ ] User cannot skip ahead to locked artists
- [ ] User receives completion bonus after rating all 10
- [ ] New list appears on Monday
- [ ] User can view past completed lists

---

## 📊 Success Metrics

### Key Performance Indicators
- **List Start Rate:** > 80% of active users start weekly list
- **Completion Rate:** > 60% of users who start complete the list
- **Average Time to Complete:** < 20 minutes per list
- **Return Rate:** > 70% of users return for next week's list
- **Rating Quality:** > 90% of ratings are valid (not spam)

---

## 🚀 Implementation Plan

### Phase 1: Database & Backend (Week 1)
- Create database schema
- Implement list management service
- Build progress tracking logic
- Create admin list creation API

### Phase 2: User Interface (Week 1-2)
- Build weekly list component
- Create artist card states (current/completed/locked)
- Implement sequential navigation
- Add progress indicator

### Phase 3: Completion & Rewards (Week 2)
- Build completion detection logic
- Create completion celebration modal
- Implement bonus points award
- Build list history view

### Phase 4: Testing & Polish (Week 3)
- Write comprehensive tests
- Improve mobile experience
- Add animations and transitions
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- ARTIST-001: Artist data must exist in database
- PROFILE-001: User profiles for personalization

### Downstream Dependencies
- RATING-001: Artist ratings complete list progression
- POINTS-001: Points awarded for list activities
- VIDEO-001: Video viewing integrated with list flow

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **List Generation Failure:** Mitigation: Fallback to auto-generated lists
- **Progress Sync Issues:** Mitigation: Robust error handling, progress backups

### UX Risks
- **Sequential Frustration:** Mitigation: Allow revisiting previous artists
- **Slow Completion:** Mitigation: Save progress, resume anytime

---

## ✏️ Notes

- Lists always start Monday at 12:00 AM (user's local time)
- Completion bonus only awarded once per list
- Users can complete previous week's list if not finished
- List history preserved indefinitely for user's records

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
