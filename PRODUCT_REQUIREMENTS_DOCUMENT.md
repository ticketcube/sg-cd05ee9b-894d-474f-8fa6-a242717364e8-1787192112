# Product Requirements Document (PRD)
## OTW Chart - Music Discovery & Rewards Platform

**Document Version:** 1.0  
**Last Updated:** October 20, 2025  
**Product Owner:** OTW Chart Team  
**Status:** Active Development

---

## Executive Summary

OTW Chart is a web-based music discovery platform that rewards users for engaging with emerging artists. The platform combines weekly artist rankings, video content consumption, user-generated ratings, and a comprehensive points-based reward system to create an engaging music discovery experience.

**Core Value Proposition:** Users earn points and rewards for discovering new music before it becomes mainstream, creating a gamified experience that benefits both music fans and emerging artists.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [Core Features & Requirements](#3-core-features--requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [User Experience & Flows](#5-user-experience--flows)
6. [Points & Rewards System](#6-points--rewards-system)
7. [Security & Privacy](#7-security--privacy)
8. [Performance Requirements](#8-performance-requirements)
9. [Future Roadmap](#9-future-roadmap)
10. [Success Metrics](#10-success-metrics)

---

## 1. Product Overview

### 1.1 Purpose
OTW Chart is designed to:
- Help music fans discover emerging artists before they become mainstream
- Reward engaged users with points, prizes, exclusive merch, and insider access
- Provide artists with exposure and engagement metrics
- Create a community of early adopters and tastemakers

### 1.2 Target Platform
- **Primary:** Progressive Web Application (PWA)
- **Technology Stack:** Next.js 15.2 (Pages Router), TypeScript, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL database, authentication, storage)
- **Deployment:** Vercel

### 1.3 Key Differentiators
- Points-based reward system with real prizes
- Weekly curated artist lists
- Multi-dimensional artist rating system (quadrant analysis)
- Video-first discovery experience
- Progressive Web App with offline capabilities

---

## 2. User Personas

### 2.1 Primary Persona: The Music Explorer
- **Age:** 18-34
- **Behavior:** Actively seeks new music, early adopter mentality
- **Goals:** Discover artists before friends, earn recognition as a tastemaker
- **Pain Points:** Too much music to filter through, no reward for discovery effort

### 2.2 Secondary Persona: The Casual Fan
- **Age:** 25-45
- **Behavior:** Occasional music discovery, prefers curated content
- **Goals:** Easy access to quality new music without extensive searching
- **Pain Points:** Overwhelmed by music platforms, unsure what to listen to

### 2.3 Tertiary Persona: The Staff/Admin
- **Role:** Content curator, platform administrator
- **Goals:** Manage weekly lists, monitor engagement, update content
- **Needs:** Administrative dashboard, analytics, content management tools

---

## 3. Core Features & Requirements

### 3.1 Authentication & User Management

#### 3.1.1 User Authentication
**Requirement ID:** AUTH-001  
**Priority:** P0 (Critical)

**Features:**
- Email/password authentication via Supabase Auth
- OAuth integration (Google, Apple - planned)
- Secure session management
- Password reset functionality
- Email verification

**Technical Implementation:**
- Service: `src/services/authService.ts`
- Component: `src/components/AuthDialog.tsx`
- Context: `src/contexts/UserProfileContext.tsx`
- Callback handler: `src/pages/auth/callback.tsx`

#### 3.1.2 User Profile System
**Requirement ID:** PROFILE-001  
**Priority:** P0 (Critical)

**Features:**
- Username and display name customization
- Avatar upload via Brandfolder integration
- City/location selection (Ticketmaster API integration)
- Role-based access control (user, staff, admin)
- Profile completion tracking

**Database Schema:**
```sql
user_profiles:
- user_id (UUID, primary key)
- username (text, unique)
- email (text)
- display_name (text)
- avatar_url (text)
- city_id (integer)
- raw_city_input (text)
- role (text: 'user', 'staff', 'admin')
- total_points (integer)
- created_at (timestamp)
- last_active (timestamp)
```

**Technical Implementation:**
- Service: `src/services/userProfileService.ts`
- Components: 
  - `src/components/ProfileSetupModal.tsx`
  - `src/components/profile/UserProfileCard.tsx`
- Page: `src/pages/profile.tsx`

---

### 3.2 Weekly Artist Discovery System

#### 3.2.1 Weekly Lists
**Requirement ID:** WEEKLY-001  
**Priority:** P0 (Critical)

**Features:**
- Admin-curated weekly artist lists
- 5 artists per week (standard configuration)
- Start and end dates for voting windows
- Active/inactive status management
- Week identifier system (e.g., "2025-W42")

**Database Schema:**
```sql
weekly_lists:
- id (serial, primary key)
- week_identifier (text, unique)
- title (text)
- description (text)
- start_date (timestamp)
- end_date (timestamp)
- is_active (boolean)
- created_at (timestamp)

weekly_list_artists:
- id (serial, primary key)
- weekly_list_id (integer, foreign key)
- artist_uuid (uuid, foreign key)
- position (integer)
- created_at (timestamp)
```

**Technical Implementation:**
- Service: `src/services/weeklyListService.ts`
- Component: `src/components/dashboard/WeeklyListCard.tsx`

#### 3.2.2 Artist Data Management
**Requirement ID:** ARTIST-001  
**Priority:** P0 (Critical)

**Features:**
- Artist profile information (name, bio, genre)
- Video content URLs (YouTube, TikTok)
- Social media links
- Chartmetric integration for analytics
- Artist lookup and search functionality

**Database Schema:**
```sql
artists:
- uuid (uuid, primary key)
- name (text)
- genre (text)
- bio (text)
- image_url (text)
- video_url (text)
- tiktok_url (text)
- instagram_handle (text)
- twitter_handle (text)
- spotify_id (text)
- chartmetric_id (integer)
- created_at (timestamp)
```

**Technical Implementation:**
- Service: `src/services/artistService.ts`
- Components:
  - `src/components/ArtistLookupPage.tsx`
  - `src/components/ArtistProfileLookup.tsx`
  - `src/components/ArtistVideoPlayer.tsx`
- Page: `src/pages/artist-lookup.tsx`

---

### 3.3 Engagement & Rating Systems

#### 3.3.1 Video Viewing System
**Requirement ID:** VIDEO-001  
**Priority:** P0 (Critical)

**Features:**
- Embedded video player (YouTube/TikTok support)
- Watch time tracking (minimum 15 seconds for points)
- Video completion detection
- Playback controls (play, pause, mute)
- Responsive video player

**Point Awards:**
- 5 points per video view (configurable)
- Frequency: Once per artist per week
- Always available (no voting window restriction)

**Technical Implementation:**
- Component: `src/components/ArtistVideoPlayer.tsx`
- Service: `src/services/weeklyVotingService.ts`

#### 3.3.2 Artist Rating System
**Requirement ID:** RATING-001  
**Priority:** P1 (High)

**Features:**
- Quadrant-based rating system:
  - **Vibe** (Chill → Hype): 1-10 scale
  - **Discovery** (Familiar → Fresh): 1-10 scale
- Simple star rating (1-5 stars)
- Rating submission per artist
- Visual quadrant display

**Point Awards:**
- 10 points per vote submission (configurable)
- Frequency: Once per week per artist
- Only available during voting windows

**Database Schema:**
```sql
user_engagements:
- id (serial, primary key)
- user_id (uuid, foreign key)
- artist_uuid (uuid, foreign key)
- engagement_type (text)
- points_earned (integer)
- week_identifier (text)
- metadata (jsonb) -- stores quadrant values
- created_at (timestamp)
```

**Technical Implementation:**
- Components:
  - `src/components/september/QuadrantRating.tsx`
  - `src/components/embed/embedVoteRating.tsx`
- Service: `src/services/embedVotingService.ts`

#### 3.3.3 Favorite Artists System
**Requirement ID:** FAV-001  
**Priority:** P2 (Medium)

**Features:**
- Users can mark artists as favorites
- Favorite artist grid display
- Sync with user profile
- Used for personalized recommendations

**Technical Implementation:**
- Service: `src/services/favoriteArtistsService.ts`
- Component: `src/components/profile/FavoriteArtistsGrid.tsx`

---

### 3.4 Points & Rewards System

#### 3.4.1 Points Configuration
**Requirement ID:** POINTS-001  
**Priority:** P0 (Critical)

**Features:**
- Database-driven point values
- Configurable frequency rules
- Minimum requirements (e.g., watch time)
- Active/inactive toggle per action
- 5-minute cache for performance

**Point Actions:**
1. **Video View**: 5 points (15+ seconds, once per artist per week)
2. **Vote Submission**: 10 points (once per week)
3. **Video Completion Bonus**: 15 points (watch all videos, once per week)
4. **Weekly Streak** (planned): 25 points (consecutive weeks)
5. **Referral Bonus** (planned): 25 points (per successful referral)

**Frequency Types:**
- `once` - One time ever
- `once_per_week` - Once per week identifier
- `once_per_artist_lifetime` - Once per artist, ever
- `once_per_artist_per_week` - Once per artist per week
- `unlimited` - No restrictions

**Database Schema:**
```sql
points_config:
- id (serial, primary key)
- action_name (text, unique)
- points_value (integer)
- min_value (integer) -- minimum requirement
- frequency (text)
- description (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**Technical Implementation:**
- Service: `src/services/pointsConfigService.ts`
- Documentation: `POINTS_SYSTEM_PLAN.md`

#### 3.4.2 Rewards System
**Requirement ID:** REWARDS-001  
**Priority:** P1 (High)

**Features:**
- Monthly reward milestones
- Prize tiers based on point totals
- Exclusive merch and experiences
- Insider access opportunities
- Stripe integration for payment processing (premium features)

**Technical Implementation:**
- Components:
  - `src/components/dashboard/MonthlyReward.tsx`
  - `src/components/dashboard/SeptemberReward.tsx`
  - `src/components/dashboard/RewardsCard.tsx`
- Page: `src/pages/september/rewards.tsx`
- API: `src/pages/api/stripe/checkout-session.ts`

#### 3.4.3 Points Dashboard
**Requirement ID:** DASHBOARD-001  
**Priority:** P0 (Critical)

**Features:**
- Total points display
- Artists discovered counter
- Weeks active tracker
- Weekly points breakdown
- Engagement history timeline
- Progress indicators

**Technical Implementation:**
- Components:
  - `src/components/dashboard/CombinedDashboardTop.tsx`
  - `src/components/points/WeeklyPointsDashboard.tsx`
  - `src/components/dashboard/DashboardHeader.tsx`
- Service: `src/services/dashboardStatsService.ts`
- Page: `src/pages/discovery-dashboard.tsx`

---

### 3.5 Notifications & User Feedback

#### 3.5.1 Points Notifications
**Requirement ID:** NOTIF-001  
**Priority:** P1 (High)

**Features:**
- Toast notifications for point awards
- Completion bonus alerts
- Streak milestone notifications
- Animated point displays

**Technical Implementation:**
- Component: `src/components/points/PointsNotification.tsx`
- Hook: `src/hooks/usePointsOnboarding.ts`

#### 3.5.2 Educational Modals
**Requirement ID:** MODAL-001  
**Priority:** P2 (Medium)

**Features:**
- "How Points Work" explanation
- First-time user onboarding
- Feature announcements
- Help documentation

**Technical Implementation:**
- Component: `src/components/points/HowPointsWorkModal.tsx`

---

### 3.6 Event & Tour Integration

#### 3.6.1 Ticketmaster Integration
**Requirement ID:** EVENT-001  
**Priority:** P2 (Medium)

**Features:**
- Fetch artist tour dates via Ticketmaster API
- Display upcoming shows by location
- Filter events by user's city
- Event caching for performance
- Show venue and date information

**Technical Implementation:**
- Services:
  - `src/services/ticketmasterService.ts`
  - `src/services/eventCacheService.ts`
  - `src/services/tourService.ts`
- Component: `src/components/ArtistShowsPopup.tsx`
- API: `src/pages/api/ticketmaster/events.ts`

#### 3.6.2 Location Services
**Requirement ID:** LOC-001  
**Priority:** P2 (Medium)

**Features:**
- City selection combobox
- Ticketmaster city lookup
- Location-based event filtering
- User location preferences

**Technical Implementation:**
- Components:
  - `src/components/CityCombobox.tsx`
  - `src/components/SimpleCityInput.tsx`
- API: `src/pages/api/cities.ts`

---

### 3.7 Progressive Web App (PWA)

#### 3.7.1 PWA Features
**Requirement ID:** PWA-001  
**Priority:** P1 (High)

**Features:**
- Installable web app
- Offline functionality
- Service worker for caching
- App manifest configuration
- Custom install prompts
- Push notifications (planned)

**Technical Implementation:**
- Manifest: `public/manifest.json`
- Service Worker: `public/sw.js`
- Component: `src/components/PWAInstallPrompt.tsx`
- Hook: `src/hooks/usePWAInstall.ts`
- Icons: `public/icons/` (192x192, 512x512)
- Documentation: `PWA_IMPLEMENTATION_SUMMARY.md`

---

### 3.8 Admin & Staff Tools

#### 3.8.1 Staff Portal
**Requirement ID:** ADMIN-001  
**Priority:** P1 (High)

**Features:**
- Protected admin routes
- Artist management interface
- Weekly list creation and management
- User engagement analytics
- Event cache refresh controls

**Technical Implementation:**
- Component: `src/components/StaffPortalTab.tsx`
- Guard: `src/components/guards/withAdminGuard.tsx`
- Services:
  - `src/services/adminArtistService.ts`
  - `src/services/artistEventService.ts`
- API: `src/pages/api/admin/protected.ts`

---

### 3.9 Embed System

#### 3.9.1 Embeddable Voting Widget
**Requirement ID:** EMBED-001  
**Priority:** P2 (Medium)

**Features:**
- Standalone voting interface
- Embeddable in external websites
- Minimal authentication flow
- Point tracking for embedded users
- Responsive design

**Technical Implementation:**
- Component: `src/components/embed/embedVoteRating.tsx`
- Service: `src/services/embedVotingService.ts`
- Page: `src/pages/embed/weekly.tsx`

---

## 4. Technical Architecture

### 4.1 Frontend Architecture

**Framework:** Next.js 15.2 (Pages Router)
**Language:** TypeScript
**Styling:** Tailwind CSS v3
**UI Components:** Shadcn/UI library
**Icons:** Lucide React v0.474.0
**State Management:** React Context API
**Forms:** React Hook Form + Zod validation
**Animations:** Framer Motion

**Directory Structure:**
```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Shadcn base components
│   ├── layout/       # Layout components (Header, AppLayout)
│   ├── dashboard/    # Dashboard-specific components
│   ├── points/       # Points system components
│   ├── profile/      # User profile components
│   └── embed/        # Embeddable components
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Next.js pages (routing)
│   └── api/          # API routes
├── services/         # Business logic & API calls
├── styles/           # Global styles
└── types/            # TypeScript type definitions
```

### 4.2 Backend Architecture

**Database:** PostgreSQL (via Supabase)
**Authentication:** Supabase Auth
**Storage:** Supabase Storage (for avatars)
**Real-time:** Supabase Realtime (planned)

**Key Database Tables:**
- `user_profiles` - User account information
- `artists` - Artist data and metadata
- `weekly_lists` - Weekly curation lists
- `weekly_list_artists` - Junction table for lists/artists
- `user_engagements` - Engagement tracking and points
- `points_config` - Points system configuration
- `favorite_artists` - User favorite artists
- `mvp_survey` - User feedback surveys

**Row Level Security (RLS):**
- Enabled on all user-facing tables
- User can only access/modify their own data
- Admin role for elevated permissions
- Public read access for artist data

### 4.3 External Integrations

**1. Ticketmaster API**
- Purpose: Fetch artist tour dates and events
- Caching: 24-hour cache per artist
- Rate Limiting: Managed via event cache service

**2. Chartmetric API**
- Purpose: Artist analytics and discovery data
- Implementation: API route proxy
- Usage: Artist lookup and insights

**3. Brandfolder API**
- Purpose: Avatar and media upload
- Implementation: Resumable upload system
- Security: Temporary upload URLs

**4. Stripe**
- Purpose: Payment processing (premium features)
- Implementation: Checkout session API
- Usage: Subscription and one-time payments

**5. YouTube & TikTok**
- Purpose: Video content embedding
- Implementation: iframe embeds
- Security: CSP headers configured

**6. PostHog**
- Purpose: Product analytics
- Implementation: Client-side tracking
- Privacy: Respects user consent

---

## 5. User Experience & Flows

### 5.1 New User Onboarding Flow

1. **Landing Page** (`src/pages/index.tsx`)
   - Hero video explaining rewards system
   - "Register to Discover Rewards" CTA
   - Current week's artist preview (no authentication required)

2. **Authentication** (`src/components/AuthDialog.tsx`)
   - Email/password signup
   - OAuth options (planned)
   - Email verification required

3. **Profile Setup** (`src/components/ProfileSetupModal.tsx`)
   - Username selection
   - City/location input
   - Avatar upload (optional)
   - "How Points Work" tutorial

4. **Discovery Dashboard** (`src/pages/discovery-dashboard.tsx`)
   - Weekly artist list
   - Points dashboard
   - Engagement options (watch videos, rate artists)

### 5.2 Weekly Engagement Flow

1. **Artist Discovery**
   - User browses current week's artist list
   - Watches artist videos (minimum 15 seconds)
   - Earns 5 points per video view

2. **Rating & Feedback**
   - Opens artist rating modal
   - Provides quadrant ratings (Vibe & Discovery scores)
   - Submits vote for 10 points

3. **Completion Bonus**
   - User completes all 5 videos
   - Earns 15-point completion bonus
   - Receives congratulatory notification

4. **Progress Tracking**
   - Dashboard updates with new points
   - Week summary shows engagement metrics
   - Rewards page displays milestone progress

### 5.3 Profile Management Flow

1. **Access Profile** (`src/pages/profile.tsx`)
   - View personal stats (points, artists discovered, weeks active)
   - See engagement quadrant analysis
   - Review favorite artists

2. **Edit Profile**
   - Update username/display name
   - Change avatar
   - Modify location
   - Update preferences

3. **View History**
   - Weekly engagement breakdown
   - Points earning timeline
   - Artist interaction history

---

## 6. Points & Rewards System

### 6.1 Point Earning Mechanics

**Video Views:**
- **Action:** Watch artist video for 15+ seconds
- **Points:** 5 (configurable)
- **Frequency:** Once per artist per week
- **Availability:** Always (no voting window restriction)
- **Tracking:** Real-time watch timer, progress indicator

**Vote Submission:**
- **Action:** Submit quadrant rating or ranking
- **Points:** 10 (configurable)
- **Frequency:** Once per week
- **Availability:** Only during active voting windows
- **Validation:** Prevents duplicate submissions

**Completion Bonus:**
- **Action:** Watch all videos in weekly list
- **Points:** 15 (configurable)
- **Frequency:** Once per week
- **Requirement:** Meet minimum watch time for each video
- **UI:** Progress bar showing X/5 videos watched

**Future Additions:**
- Weekly Streak Bonus: 25 points (consecutive weeks)
- Referral Bonus: 25 points (per successful referral)
- Daily Login: Configurable points

### 6.2 Points Configuration System

**Database-Driven:**
- All point values stored in `points_config` table
- Admin can modify values without code deployment
- 5-minute cache for performance
- Supports complex frequency rules

**Eligibility Checking:**
```typescript
checkEligibility(userId, actionName, context) {
  // Checks:
  // 1. Is action currently active?
  // 2. Has user already earned points for this action?
  // 3. Does user meet minimum requirements?
  // 4. Is action within valid time window?
  // Returns: { eligible: boolean, reason?: string }
}
```

### 6.3 Reward Tiers (Example)

**Bronze Tier (0-100 points):**
- Welcome badge
- Basic community access

**Silver Tier (101-250 points):**
- Exclusive Discord channel
- Early access to new features

**Gold Tier (251-500 points):**
- Limited edition digital merch
- Artist meet & greet raffle entry

**Platinum Tier (501+ points):**
- Physical merch package
- VIP event access
- Priority artist suggestions

---

## 7. Security & Privacy

### 7.1 Authentication Security

**Supabase Auth:**
- Industry-standard JWT tokens
- Secure session management
- Token refresh handling
- Email verification required

**Password Requirements:**
- Minimum 8 characters
- Enforced by Supabase Auth
- Reset via email link

### 7.2 Row Level Security (RLS)

**User Data Protection:**
```sql
-- Users can only access their own profiles
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only modify their own engagements
CREATE POLICY "Users can insert own engagements" 
ON user_engagements FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

**Public Data:**
```sql
-- Anyone can view artists
CREATE POLICY "Anyone can view artists" 
ON artists FOR SELECT 
USING (true);

-- Anyone can view active weekly lists
CREATE POLICY "Anyone can view active lists" 
ON weekly_lists FOR SELECT 
USING (is_active = true);
```

### 7.3 API Security

**Rate Limiting:**
- Implemented on all API routes
- Per-user request limits
- Cached responses where appropriate

**Input Validation:**
- Zod schema validation on all forms
- SQL injection prevention via parameterized queries
- XSS protection via React's default escaping

**CORS Configuration:**
- Restrictive CORS for API routes
- Whitelisted domains for embed system

### 7.4 Privacy Compliance

**Data Collection:**
- Email (required for authentication)
- Username (public display)
- Location (city-level, optional)
- Engagement data (internal analytics)

**User Rights:**
- Account deletion capability
- Data export (planned)
- Opt-out of analytics
- Email preferences management

**GDPR/CCPA:**
- Privacy policy displayed
- Cookie consent (planned)
- Data retention policies
- Third-party disclosure

---

## 8. Performance Requirements

### 8.1 Page Load Performance

**Target Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Optimization Strategies:**
- Code splitting via Next.js dynamic imports
- Image optimization with Next.js Image component
- CSS-in-JS with Tailwind for minimal bundle size
- Lazy loading for below-fold content

### 8.2 API Response Times

**Target Response Times:**
- Authentication: < 500ms
- User profile fetch: < 300ms (with caching)
- Artist data: < 400ms
- Points calculation: < 200ms
- Dashboard load: < 800ms (full data)

**Caching Strategy:**
- SessionStorage for user profiles (5-minute TTL)
- Supabase query caching
- Event cache (24-hour TTL for Ticketmaster data)
- Points config cache (5-minute TTL)

### 8.3 Database Performance

**Query Optimization:**
- Indexed foreign keys
- Composite indexes on frequently joined columns
- Materialized views for complex aggregations (planned)
- Limit queries to necessary columns only

**Connection Management:**
- Supabase connection pooling
- Abort signals for cancelled requests
- Retry logic with exponential backoff

### 8.4 Scalability Considerations

**Current Architecture:**
- Serverless deployment via Vercel
- Auto-scaling based on traffic
- Supabase managed database (automatic scaling)

**Future Scaling:**
- CDN for static assets
- Redis for session/cache management
- Read replicas for database (if needed)
- GraphQL for complex data fetching

---

## 9. Future Roadmap

### 9.1 Phase 2 Features (Q1 2026)

**Weekly Streak System:**
- Track consecutive weeks of engagement
- Award 25 bonus points per streak
- Display streak badges and counters
- Send streak reminder notifications

**Referral Program:**
- Unique referral codes per user
- 25 points per successful referral
- Fraud detection and validation
- Referral leaderboard

**Enhanced Analytics:**
- Personal listening insights
- Genre preference analysis
- Discovery timeline visualization
- Engagement patterns dashboard

### 9.2 Phase 3 Features (Q2 2026)

**Social Features:**
- Follow other users
- Share artist discoveries
- Comment on artist profiles
- Create custom playlists

**Artist Interactions:**
- Artist Q&A sessions
- Exclusive content for engaged users
- Artist appreciation messages
- Early access to new releases

**Advanced Rewards:**
- Physical merchandise store
- Points-to-prizes redemption
- Auction system for rare items
- Partnership perks (Spotify, concert tickets)

### 9.3 Phase 4 Features (Q3-Q4 2026)

**Mobile Native Apps:**
- iOS app (React Native or Swift)
- Android app (React Native or Kotlin)
- Push notification support
- Offline-first architecture

**Machine Learning:**
- Personalized artist recommendations
- Predictive engagement scoring
- Taste profile generation
- Similar user matching

**Ecosystem Expansion:**
- API for third-party integrations
- White-label solution for labels
- Festival and venue partnerships
- Educational content for artists

---

## 10. Success Metrics

### 10.1 User Engagement Metrics

**Primary KPIs:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average session duration
- Videos watched per user per week
- Vote submission rate
- Completion bonus earn rate

**Retention Metrics:**
- Day 1 retention rate: Target 60%
- Week 1 retention rate: Target 40%
- Month 1 retention rate: Target 25%
- Churn rate: Target < 10% monthly

### 10.2 Points System Metrics

**Point Distribution:**
- Average points earned per user per week
- Point earning pattern analysis
- Most popular point-earning actions
- Completion bonus achievement rate

**Reward Effectiveness:**
- Points-to-reward conversion rate
- Reward redemption patterns
- User satisfaction with rewards
- Reward tier distribution

### 10.3 Content Metrics

**Artist Engagement:**
- Videos watched per artist
- Average rating per artist
- Share of voice per artist
- Artist discovery rate (new vs. returning)

**Weekly List Performance:**
- Participation rate per week
- Peak engagement days/times
- Drop-off points in user journey
- Week-over-week growth

### 10.4 Technical Performance

**System Health:**
- API error rate: Target < 0.5%
- Database query performance: Target < 300ms avg
- Page load times: Meet Web Vitals targets
- Uptime: Target 99.9%

**User Experience:**
- Net Promoter Score (NPS): Target 40+
- Task completion rate: Target > 90%
- Feature adoption rate
- User-reported bugs: Target < 10 per week

### 10.5 Business Metrics

**Revenue (if applicable):**
- Premium subscription conversion rate
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)
- Cost per acquisition (CPA)

**Growth:**
- Month-over-month user growth
- Referral program conversion rate
- Social media engagement
- Press mentions and partnerships

---

## Appendix

### A. Glossary

- **Week Identifier**: String format YYYY-Wxx representing calendar week (e.g., "2025-W42")
- **Quadrant Rating**: Two-dimensional rating system (Vibe: Chill↔Hype, Discovery: Familiar↔Fresh)
- **Engagement**: Any user action that can earn points (video view, vote, etc.)
- **Completion Bonus**: Extra points awarded for watching all videos in a week
- **RLS**: Row Level Security - database-level access control
- **PWA**: Progressive Web App - installable web application

### B. Related Documentation

- `POINTS_SYSTEM_PLAN.md` - Detailed points system implementation
- `PWA_IMPLEMENTATION_SUMMARY.md` - PWA setup and features
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `AUTH_RLS_REFACTOR_PLAN.md` - Security architecture
- `WEEKLY_RATINGS_FUNCTIONALITY_PLAN.md` - Rating system details

### C. Technical Dependencies

**Production Dependencies:**
- Next.js 15.2
- React 18+
- TypeScript 5+
- Tailwind CSS 3.4
- Supabase JS SDK 2.x
- React Hook Form
- Zod validation
- Framer Motion
- Lucide React
- Recharts (for visualizations)

**Development Dependencies:**
- ESLint
- TypeScript ESLint
- Prettier (planned)
- Husky (planned)

### D. Contact & Support

**Development Team:**
- Product Lead: [Name]
- Tech Lead: [Name]
- Backend: Supabase managed service
- Frontend: Next.js/React team

**Support Channels:**
- Email: support@otwchart.com
- Discord: [Link]
- GitHub: [Repository]

---

**Document Control:**
- **Version History:**
  - v1.0 (2025-10-20): Initial PRD based on current implementation
- **Review Schedule:** Quarterly
- **Next Review Date:** 2026-01-20
- **Approval Status:** Draft for review

---

*This PRD is a living document and will be updated as the product evolves.*