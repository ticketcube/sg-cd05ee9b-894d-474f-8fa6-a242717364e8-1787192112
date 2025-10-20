---
name: Feature Requirement
about: Points Dashboard
title: '[DASHBOARD-001] Points Dashboard'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-gamification']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** DASHBOARD-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** User Experience  
**Component:** Points Dashboard  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** POINTS-001 (Points Configuration), AUTH-001 (User Authentication), PROFILE-001 (User Profiles)

---

## 📝 Feature Description

### Overview
Centralized dashboard displaying user's points balance, progress, activity breakdown, weekly challenges, and rewards preview. Primary hub for gamification and engagement tracking.

### User Story
**As a** user  
**I want to** see my points, progress, and available actions in one place  
**So that** I understand how to earn more and what I can unlock

### Business Value
- **Engagement Hub:** Single destination that encourages daily return
- **Progress Visualization:** Clear progress motivates continued engagement
- **Discovery:** Surfaces new activities and rewards to drive behavior
- **Retention:** Shows accumulated value and upcoming milestones
- **Metrics Dashboard:** Provides user-level engagement analytics

---

## ✅ Requirements

### Functional Requirements

#### Points Overview Section
- [ ] **Current Balance Display**
  - Large, prominent points count
  - Visual coin/star icon animation
  - Recent points change indicator (+X today)
  - Animated counter on balance updates

- [ ] **Tier Progress**
  - Current tier badge (Bronze/Silver/Gold/Platinum)
  - Progress bar to next tier
  - Points needed for next tier
  - Tier benefits summary
  - Celebration animation on tier upgrade

#### Weekly Activity Summary
- [ ] **This Week's Stats**
  - Videos watched (count + points)
  - Artists rated (count + points)
  - Weekly list progress (X/10 completed)
  - Daily login streak counter
  - Total points earned this week

- [ ] **Weekly Challenge Card**
  - Challenge description (e.g., "Rate 10 artists")
  - Progress bar (X/10)
  - Bonus points reward
  - Time remaining (countdown)
  - "Claim Reward" button when complete

#### Activity Breakdown
- [ ] **Points by Activity Type (Pie Chart)**
  - Videos: X points (Y%)
  - Ratings: X points (Y%)
  - Lists: X points (Y%)
  - Other: X points (Y%)
  - Interactive chart with hover details

- [ ] **Recent Activity Feed**
  - Last 5 point-earning activities
  - Show activity type, points earned, timestamp
  - Link to related content
  - "View All" link to full transaction history

#### Quick Actions
- [ ] **Shortcuts to Earn Points**
  - "Watch Videos" button
  - "Rate Artists" button
  - "Complete Weekly List" button
  - "Explore Rewards" button
  - Each shows potential points to earn

#### Rewards Preview
- [ ] **Featured Rewards**
  - Show 3-4 featured rewards
  - Display point cost
  - "Redeem" or "X more points needed"
  - Link to full rewards marketplace

#### Monthly Competition Widget
- [ ] **Leaderboard Preview**
  - Show top 3 users
  - User's current rank
  - Points behind leader
  - "View Full Leaderboard" link

### Non-Functional Requirements

#### Performance
- [ ] **Dashboard Load:** < 800ms to display all widgets
- [ ] **Real-time Updates:** Balance updates within 1 second of action
- [ ] **Chart Rendering:** < 300ms for data visualization

#### Usability
- [ ] **Mobile Responsive:** Optimized layout for mobile screens
- [ ] **Visual Hierarchy:** Clear focus on most important metrics
- [ ] **Accessibility:** WCAG AA compliant, keyboard navigation

#### Design
- [ ] **Consistent Branding:** Matches app design system
- [ ] **Delightful Animations:** Subtle, purposeful motion
- [ ] **Data Visualization:** Clear, easy-to-understand charts

---

## 🎨 User Interface Requirements

### Desktop Dashboard Layout
```
┌──────────────────────────────────────────────────────────┐
│ 🏠 Dashboard                                   👤 User   │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌──────────────────────────┐  │
│ │ 🎯 Your Points      │  │ 🏆 Tier Progress         │  │
│ │                     │  │                          │  │
│ │    ⭐ 1,250        │  │ Gold 🏆                  │  │
│ │   (+35 today)       │  │ ████████░░ 80%          │  │
│ │                     │  │ 250 pts to Platinum      │  │
│ └─────────────────────┘  └──────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 📊 This Week's Activity                            │  │
│ │ Videos Watched: 24 (120 pts) ▬▬▬▬▬▬▬▬▬░          │  │
│ │ Artists Rated: 10 (50 pts)   ▬▬▬▬▬░░░░░          │  │
│ │ Weekly List: 8/10 (0 pts)    ▬▬▬▬▬▬▬▬░░          │  │
│ │ Daily Logins: 5 (10 pts)     ▬▬▬▬▬░░░░░          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌──────────────────┐  ┌────────────────────────────┐   │
│ │ 🎯 Weekly        │  │ 🎁 Featured Rewards        │   │
│ │ Challenge        │  │                            │   │
│ │                  │  │ [Img] [Img] [Img] [Img]   │   │
│ │ Rate 10 Artists  │  │ 500pt 100pt 250pt 2000pt  │   │
│ │ ████████░░ 8/10  │  │                            │   │
│ │ +15 bonus pts    │  │ [View All Rewards →]       │   │
│ │ 2 days left      │  │                            │   │
│ └──────────────────┘  └────────────────────────────┘   │
│                                                          │
│ ┌──────────────────┐  ┌────────────────────────────┐   │
│ │ 📈 Points        │  │ 🏆 Monthly Competition     │   │
│ │ Breakdown        │  │                            │   │
│ │                  │  │ 1. User123    2,450 pts    │   │
│ │ [Pie Chart]      │  │ 2. MusicFan   2,100 pts    │   │
│ │ Videos 120 (66%) │  │ 3. Groover99  1,980 pts    │   │
│ │ Ratings 50 (28%) │  │ ...                        │   │
│ │ Other 10 (6%)    │  │ 15. You       1,250 pts    │   │
│ │                  │  │ [View Leaderboard →]       │   │
│ └──────────────────┘  └────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ⚡ Quick Actions                                   │  │
│ │ [Watch Videos] [Rate Artists] [Weekly List] [Earn]│  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Mobile Dashboard Layout
```
┌────────────────────────┐
│ 🏠 Dashboard    👤 User│
├────────────────────────┤
│ ⭐ 1,250 Points       │
│ (+35 today)            │
│                        │
│ Gold 🏆               │
│ ████████░░ 80%        │
│ 250 pts to Platinum    │
├────────────────────────┤
│ 📊 This Week           │
│ Videos: 24 (120 pts)   │
│ Ratings: 10 (50 pts)   │
│ List: 8/10 (0 pts)     │
│ Logins: 5 (10 pts)     │
├────────────────────────┤
│ 🎯 Weekly Challenge    │
│ Rate 10 Artists        │
│ ████████░░ 8/10       │
│ +15 bonus pts          │
│ 2 days left            │
├────────────────────────┤
│ 🎁 Featured Rewards    │
│ [Img] [Img] [Img]      │
│ 500pt 100pt 250pt      │
│ [View All →]           │
├────────────────────────┤
│ ⚡ Quick Actions       │
│ [Watch] [Rate] [List]  │
└────────────────────────┘
```

---

## 🔧 Technical Specifications

### Data Aggregation Service
```typescript
// src/services/dashboardStatsService.ts
export const dashboardStatsService = {
  // Get all dashboard data in one call
  getDashboardData: async (userId: string) => {
    const [
      pointsData,
      weeklyStats,
      activityBreakdown,
      recentActivity,
      weeklyChallenge,
      featuredRewards,
      leaderboardPreview
    ] = await Promise.all([
      getUserPointsData(userId),
      getWeeklyStats(userId),
      getActivityBreakdown(userId),
      getRecentActivity(userId, 5),
      getWeeklyChallenge(userId),
      getFeaturedRewards(4),
      getLeaderboardPreview(userId)
    ]);
    
    return {
      pointsData,
      weeklyStats,
      activityBreakdown,
      recentActivity,
      weeklyChallenge,
      featuredRewards,
      leaderboardPreview
    };
  },
  
  // Get weekly statistics
  getWeeklyStats: async (userId: string) => {
    // Query points_transactions for current week
    // Group by activity_type
    // Return counts and points for each activity
  },
  
  // Get activity breakdown (for pie chart)
  getActivityBreakdown: async (userId: string) => {
    // Query points_transactions
    // Group by activity_type
    // Calculate percentages
  },
  
  // Check weekly challenge progress
  getWeeklyChallenge: async (userId: string) => {
    // Check user's progress on current week's challenge
    // Return challenge details and progress
  }
};
```

### Component Structure
```
src/components/dashboard/
├── DashboardLayout.tsx          // Main layout wrapper
├── PointsOverview.tsx           // Points balance + tier progress
├── WeeklySummary.tsx            // This week's activity stats
├── WeeklyChallenge.tsx          // Challenge card
├── ActivityBreakdown.tsx        // Pie chart component
├── RecentActivity.tsx           // Activity feed
├── QuickActions.tsx             // Action buttons
├── FeaturedRewards.tsx          // Rewards preview carousel
└── LeaderboardPreview.tsx       // Competition widget
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test data aggregation logic
- [ ] Test percentage calculations
- [ ] Test date range filtering (this week)
- [ ] Test tier progress calculation

### Integration Tests
- [ ] Test dashboard data loading
- [ ] Test real-time balance updates
- [ ] Test weekly challenge tracking
- [ ] Test chart data accuracy

### E2E Tests
- [ ] Dashboard loads within performance target
- [ ] Points balance updates after earning action
- [ ] Weekly stats reflect completed activities
- [ ] Quick action buttons navigate correctly
- [ ] Tier progress updates on point changes
- [ ] Mobile layout renders correctly

---

## 📊 Success Metrics

### Key Performance Indicators
- **Dashboard Visit Rate:** > 70% of active users visit weekly
- **Return Visit Rate:** > 50% of users visit dashboard daily
- **Action Conversion:** > 40% of users click quick action buttons
- **Average Time on Page:** > 30 seconds

---

## 🚀 Implementation Plan

### Phase 1: Core Layout & Points (Week 1)
- Create dashboard layout
- Build points overview section
- Implement tier progress display
- Add real-time balance updates

### Phase 2: Activity Tracking (Week 1-2)
- Build weekly summary widget
- Create activity breakdown chart
- Implement recent activity feed
- Add weekly challenge card

### Phase 3: Engagement Features (Week 2)
- Add quick action buttons
- Build featured rewards carousel
- Create leaderboard preview
- Implement navigation

### Phase 4: Polish & Testing (Week 2)
- Optimize performance
- Add animations and transitions
- Write comprehensive tests
- Mobile optimization

---

## 🔗 Dependencies

### Upstream Dependencies
- POINTS-001: Points data and balance
- AUTH-001: User authentication
- PROFILE-001: User tier and profile data

### Downstream Dependencies
- REWARDS-001: Links to rewards marketplace
- VIDEO-001: Quick action to video watching
- RATING-001: Quick action to rating interface
- WEEKLY-001: Quick action to weekly lists

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **Performance:** Mitigation: Data aggregation, caching, parallel queries
- **Real-time Sync:** Mitigation: WebSocket updates or polling

### UX Risks
- **Information Overload:** Mitigation: Progressive disclosure, clear hierarchy
- **Confusion:** Mitigation: User testing, clear labels, onboarding tooltips

---

## ✏️ Notes

- Dashboard is the primary engagement touchpoint
- Should load fast and update in real-time
- Mobile-first design critical (most traffic is mobile)
- Consider A/B testing different layouts

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
