---
name: Feature Requirement
about: User Profile System
title: '[PROFILE-001] User Profile System'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-profile']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** PROFILE-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** User Profile  
**Component:** Profile Management  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** AUTH-001 (User Authentication)

---

## 📝 Feature Description

### Overview
Comprehensive user profile system that stores user preferences, location data, favorite artists, engagement history, and points balance. Enables personalized recommendations, location-based event discovery, and gamification tracking.

### User Story
**As a** registered user  
**I want to** create and manage my profile with my location and preferences  
**So that** I can receive personalized artist recommendations and local event notifications

### Business Value
- **Personalization:** Better recommendations increase engagement and retention
- **Location Targeting:** Drive ticket sales through location-based event discovery
- **User Data:** Rich user profiles enable targeted advertising
- **Gamification:** Points tracking motivates continued engagement
- **Community:** User profiles enable social features in future phases

---

## ✅ Requirements

### Functional Requirements

#### Profile Creation & Setup
- [ ] **Initial Profile Setup**
  - Prompt new users to complete profile after registration
  - Collect: full name, location (city/state), favorite genres
  - Optional: avatar upload, bio, social links
  - Save profile data to database
  - Link profile to auth.users ID

- [ ] **Location Selection**
  - City/state selection via searchable dropdown (US cities)
  - Auto-detect user location (with permission)
  - Fallback to manual entry if detection fails
  - Store location as city, state, country format
  - Update location dynamically (saved immediately)

- [ ] **Favorite Artists**
  - Add up to 10 favorite artists
  - Search for artists via Chartmetric API
  - Display artist thumbnail and name
  - Remove artists from favorites
  - Track when artists were added (for recommendations)

#### Profile Viewing
- [ ] **Profile Page**
  - Display user's full name, location, bio
  - Show avatar (or default icon)
  - Display points balance prominently
  - Show reward tier status (Bronze/Silver/Gold/Platinum)
  - List favorite artists with thumbnails
  - Show engagement stats (videos watched, ratings given, lists completed)

- [ ] **Profile Statistics**
  - Total points earned (lifetime)
  - Current month points
  - Videos watched (total)
  - Artists rated (total)
  - Weekly lists completed (total)
  - Tickets purchased (total)
  - Rewards redeemed (total)

#### Profile Editing
- [ ] **Edit Profile Information**
  - Edit full name
  - Edit bio (max 200 characters)
  - Change location (city/state)
  - Update favorite genres
  - Add/remove favorite artists
  - Save changes with confirmation

- [ ] **Avatar Management**
  - Upload profile picture (max 2MB, JPG/PNG)
  - Crop/resize avatar before upload
  - Use Supabase Storage for avatar storage
  - Display avatar throughout app
  - Remove avatar (revert to default)

- [ ] **Privacy Settings**
  - Toggle profile visibility (public/private)
  - Control what data is shown publicly
  - Manage email notification preferences
  - Opt in/out of marketing emails

#### User Engagement Tracking
- [ ] **Engagement History**
  - Track all artist ratings (with timestamps)
  - Track weekly list completions
  - Track video views (unique artist views)
  - Track points earned (with source attribution)
  - Track reward redemptions
  - Display engagement timeline in profile

- [ ] **User Preferences**
  - Preferred genres (multiple selection)
  - Notification preferences (email, push)
  - Content filters (explicit content toggle)
  - Email frequency (daily, weekly, monthly)

### Non-Functional Requirements

#### Performance
- [ ] **Profile Load Time:** < 1 second to load profile page
- [ ] **Profile Update:** < 500ms to save profile changes
- [ ] **Avatar Upload:** < 3 seconds to upload and process
- [ ] **Location Search:** < 200ms to display city search results

#### Security
- [ ] **Data Privacy:** Row-level security (RLS) on profiles table
- [ ] **Access Control:** Users can only edit their own profiles
- [ ] **Secure Storage:** Avatar images stored securely in Supabase Storage
- [ ] **Input Validation:** Sanitize all user inputs (bio, name, etc.)

#### Usability
- [ ] **Mobile Responsive:** Profile works seamlessly on mobile devices
- [ ] **Intuitive Editing:** Clear edit buttons and save confirmations
- [ ] **Visual Feedback:** Loading states for all profile operations
- [ ] **Error Handling:** Clear error messages for failed operations

#### Scalability
- [ ] **Database Indexing:** Indexes on user_id, location for fast queries
- [ ] **Image Optimization:** Avatars compressed and optimized
- [ ] **Caching:** Profile data cached to reduce database queries

---

## 🎨 User Interface Requirements

### Profile Setup Modal (First-Time Users)
- Welcome message
- Full name input
- Location selection (searchable dropdown)
- Favorite genres (multi-select)
- "Complete Setup" button
- "Skip for now" option (can complete later)

### Profile Page Layout
```
┌─────────────────────────────────────┐
│ Header                               │
├─────────────────────────────────────┤
│ [Avatar] Full Name                   │
│         📍 City, State               │
│         💬 Bio text...               │
│         ⭐ Points: 1,250 (Gold)      │
│         [Edit Profile Button]        │
├─────────────────────────────────────┤
│ 📊 Engagement Stats                  │
│   Videos Watched: 45                 │
│   Artists Rated: 32                  │
│   Lists Completed: 8                 │
├─────────────────────────────────────┤
│ 🎸 Favorite Artists (10)             │
│   [Artist 1] [Artist 2] [Artist 3]   │
│   [Artist 4] [Artist 5] [Artist 6]   │
│   ...                                │
├─────────────────────────────────────┤
│ 🎯 Recent Activity                   │
│   - Rated "Artist Name" (2 days ago) │
│   - Completed Week 42 (5 days ago)   │
│   - Earned 25 points (1 week ago)    │
└─────────────────────────────────────┘
```

### Edit Profile Modal
- Full name input
- Bio textarea (200 char limit with counter)
- Location selection (searchable)
- Avatar upload (drag-and-drop or click)
- Favorite genres (multi-select checkboxes)
- Privacy settings toggles
- "Save Changes" button
- "Cancel" button

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  favorite_genres TEXT[],
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  artists_rated INTEGER DEFAULT 0,
  lists_completed INTEGER DEFAULT 0,
  tickets_purchased INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  profile_visibility TEXT DEFAULT 'public', -- public, private
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorite artists (many-to-many relationship)
CREATE TABLE user_favorite_artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL, -- Chartmetric ID
  artist_name TEXT NOT NULL,
  artist_image_url TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_profiles_location ON profiles(city, state);
CREATE INDEX idx_favorite_artists_user_id ON user_favorite_artists(user_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (profile_visibility = 'public');

-- Similar RLS for user_favorite_artists
```

### Service Implementation
```typescript
// src/services/userProfileService.ts
export const userProfileService = {
  // Get user profile by ID
  getProfile: async (userId: string) => { ... },
  
  // Update user profile
  updateProfile: async (userId: string, updates: Partial<Profile>) => { ... },
  
  // Upload avatar
  uploadAvatar: async (userId: string, file: File) => { ... },
  
  // Add favorite artist
  addFavoriteArtist: async (userId: string, artistId: string, artistName: string) => { ... },
  
  // Remove favorite artist
  removeFavoriteArtist: async (userId: string, artistId: string) => { ... },
  
  // Get favorite artists
  getFavoriteArtists: async (userId: string) => { ... },
  
  // Update engagement stats
  incrementVideoWatch: async (userId: string) => { ... },
  incrementArtistRated: async (userId: string) => { ... },
  incrementListCompleted: async (userId: string) => { ... },
  
  // Get user engagement stats
  getEngagementStats: async (userId: string) => { ... }
};
```

### React Context (UserProfileContext)
```typescript
// src/contexts/UserProfileContext.tsx
interface UserProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addFavoriteArtist: (artistId: string, artistName: string) => Promise<void>;
  removeFavoriteArtist: (artistId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test profile data validation
- [ ] Test avatar upload logic
- [ ] Test location search/selection
- [ ] Test favorite artist add/remove
- [ ] Test profile update logic

### Integration Tests
- [ ] Test complete profile creation flow
- [ ] Test profile data persistence
- [ ] Test avatar upload and storage
- [ ] Test favorite artists CRUD operations
- [ ] Test engagement stats updates

### E2E Tests
- [ ] User can complete initial profile setup
- [ ] User can edit profile information
- [ ] User can upload and change avatar
- [ ] User can add favorite artists
- [ ] User can remove favorite artists
- [ ] Profile data persists across sessions
- [ ] Engagement stats update correctly

---

## 📊 Success Metrics

### Key Performance Indicators
- **Profile Completion Rate:** > 75% of new users complete initial profile
- **Location Entry Rate:** > 90% of users provide location
- **Favorite Artists:** Average 5+ favorite artists per user
- **Profile Edit Rate:** > 40% of users edit profile at least once
- **Avatar Upload Rate:** > 50% of users upload custom avatar
- **Engagement Stat Accuracy:** 100% accuracy in stat tracking

---

## 🚀 Implementation Plan

### Phase 1: Core Profile (Week 1)
- Create profiles table and RLS policies
- Implement profile creation on signup
- Build initial profile setup modal
- Implement profile viewing page

### Phase 2: Profile Editing (Week 1-2)
- Build edit profile modal
- Implement profile update functionality
- Add avatar upload feature
- Test profile editing flows

### Phase 3: Favorite Artists & Stats (Week 2-3)
- Build favorite artists feature
- Implement engagement stat tracking
- Create stats display on profile page
- Test favorite artists CRUD

### Phase 4: Testing & Polish (Week 3)
- Write comprehensive tests
- Improve mobile responsiveness
- Add loading states and animations
- Final QA and bug fixes

---

## 🔗 Dependencies

### Upstream Dependencies
- AUTH-001: User authentication system must be complete

### Downstream Dependencies
- WEEKLY-001: Weekly lists need user location for personalization
- EVENT-001: Ticketmaster integration uses user location
- POINTS-001: Points system reads/updates profile points balance
- REWARDS-001: Rewards system checks points balance

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **Data Privacy Concerns:** Mitigation: Clear privacy policy, RLS enforcement
- **Avatar Storage Costs:** Mitigation: Image compression, size limits
- **Location Accuracy:** Mitigation: Allow manual location entry

### UX Risks
- **Profile Setup Friction:** Mitigation: Allow skip and complete later
- **Privacy Concerns:** Mitigation: Make privacy settings prominent

---

## ✏️ Notes

- Profile data used for personalized recommendations
- Location required for event discovery and ticket sales
- Favorite artists improve weekly list curation
- Engagement stats drive gamification and retention
- Profile completion tied to onboarding points bonus

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
