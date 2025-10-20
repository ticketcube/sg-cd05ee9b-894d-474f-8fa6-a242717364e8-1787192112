---
name: Feature Requirement
about: Points Configuration System
title: '[POINTS-001] Points Configuration System'
labels: ['requirement', 'priority-p0', 'phase-1', 'component-gamification']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** POINTS-001  
**Priority:** P0 - Critical  
**Phase:** MVP (Phase 1)  
**Feature Area:** Gamification  
**Component:** Points System  
**Estimated Effort:** 2 weeks  
**Dependencies:** AUTH-001 (User Authentication), PROFILE-001 (User Profile System)

---

## 📝 Feature Description

### Overview
Comprehensive points system that rewards user engagement activities. Points are earned through video watching, artist rating, weekly list completion, and other interactions. Points unlock rewards tiers and drive user retention.

### User Story
**As a** engaged user  
**I want to** earn points for discovering artists and engaging with content  
**So that** I can unlock rewards and track my progress

### Business Value
- **Retention Driver:** Gamification increases daily active users
- **Engagement Metric:** Points track and incentivize valuable user actions
- **Monetization Enabler:** Points system supports rewards marketplace
- **Behavioral Psychology:** Progress tracking creates habit-forming loops
- **Data Quality:** Point requirements ensure quality engagement (not spam)

---

## ✅ Requirements

### Functional Requirements

#### Points Configuration
- [ ] **Activity Point Values**
  - Video watch (>80% completion): 5 points
  - Artist rating: 5 points
  - Weekly list completion bonus: 15 points
  - Profile completion: 10 points (one-time)
  - First login (daily): 2 points
  - Referral (friend signs up): 25 points
  - Event check-in: 10 points
  - Social share: 3 points

- [ ] **Points Rules**
  - Each activity only awards points once per unique item
  - Cannot earn points for same video/artist multiple times
  - Daily login points reset at midnight
  - Points cannot be negative (minimum 0)
  - Points are non-transferable between users

#### Points Earning
- [ ] **Automatic Point Award**
  - Points awarded immediately upon activity completion
  - Real-time balance update in UI
  - Toast notification shows points earned
  - Transaction recorded in database with timestamp
  - Activity type and reference ID stored

- [ ] **Points Validation**
  - Verify user completed required action (e.g., watched 80% of video)
  - Check for duplicate point awards
  - Rate limiting to prevent spam/gaming
  - Admin approval required for manual point adjustments

#### Points Tracking
- [ ] **User Points Balance**
  - Current points (available for rewards)
  - Total lifetime points earned
  - Points redeemed (historical)
  - Points breakdown by activity type
  - Monthly points earned (current month)

- [ ] **Transaction History**
  - List all point transactions (earned + redeemed)
  - Show date, activity, points change, balance after
  - Filter by date range, activity type
  - Export transaction history (CSV)

#### Tier System
- [ ] **Reward Tiers Based on Lifetime Points**
  - Bronze: 0-99 points (default)
  - Silver: 100-499 points
  - Gold: 500-999 points
  - Platinum: 1000+ points

- [ ] **Tier Benefits**
  - Higher tiers unlock exclusive rewards
  - Tier badges displayed in profile
  - Progress bar to next tier
  - Celebrate tier upgrades with modal

### Non-Functional Requirements

#### Performance
- [ ] **Point Award Speed:** < 200ms to record and update balance
- [ ] **Balance Display:** < 100ms to load user's point balance
- [ ] **Transaction History:** < 500ms to load 100 transactions

#### Accuracy
- [ ] **Duplicate Prevention:** 100% prevention of duplicate awards
- [ ] **Balance Accuracy:** Points balance always mathematically correct
- [ ] **Audit Trail:** Complete transaction history for accounting

#### Scalability
- [ ] **High Volume:** Handle 1000+ point transactions per minute
- [ ] **Database Performance:** Indexed queries for fast lookups
- [ ] **Caching:** Cache user balances to reduce database load

---

## 🎨 User Interface Requirements

### Points Balance Display (Header)
```
┌──────────────────────────────┐
│ 👤 User Name                 │
│ ⭐ 1,250 points (Gold 🏆)   │
└──────────────────────────────┘
```

### Points Notification (Toast)
```
┌─────────────────────────────┐
│ 🎉 +5 points earned!        │
│ Watched "Artist Name" video │
│ Total: 1,250 points         │
└─────────────────────────────┘
```

### Points Dashboard
```
┌─────────────────────────────────────┐
│ 🏆 Your Points                      │
├─────────────────────────────────────┤
│ Current Balance: 1,250 points       │
│ Lifetime Earned: 1,375 points       │
│ Redeemed: 125 points                │
│                                     │
│ Tier: Gold 🏆                       │
│ Progress to Platinum: ████░░░░ 50% │
│ (250 more points needed)            │
├─────────────────────────────────────┤
│ This Month: 180 points              │
│                                     │
│ Breakdown:                          │
│ • Videos Watched: 120 pts (24 vids) │
│ • Artists Rated: 50 pts (10 rates) │
│ • List Completion: 15 pts (1 list)  │
│ • Daily Logins: 10 pts (5 days)    │
└─────────────────────────────────────┘
```

### Transaction History
```
┌──────────────────────────────────────┐
│ 📜 Points History                    │
│ [This Month ▼] [Export CSV]         │
├──────────────────────────────────────┤
│ Date       | Activity      | Points  │
│ Oct 20     | Video watch   | +5      │
│ Oct 20     | Artist rating | +5      │
│ Oct 19     | List complete | +15     │
│ Oct 19     | Reward redeem | -50     │
│ Oct 18     | Daily login   | +2      │
│ ...                                  │
└──────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Points configuration (adjustable by admin)
CREATE TABLE points_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT UNIQUE NOT NULL, -- video_watch, artist_rating, list_completion, etc.
  points_value INTEGER NOT NULL,
  description TEXT,
  is_repeatable BOOLEAN DEFAULT false,
  max_per_day INTEGER, -- NULL = unlimited
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User points balance
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  current_tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  monthly_points INTEGER DEFAULT 0, -- Reset monthly
  last_monthly_reset DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points transactions (audit log)
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  points_change INTEGER NOT NULL, -- Positive for earned, negative for redeemed
  balance_after INTEGER NOT NULL,
  reference_id TEXT, -- e.g., video_id, artist_id, reward_id
  reference_type TEXT, -- video, artist, reward, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uniqueness tracking (prevent duplicate awards)
CREATE TABLE points_awarded (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  reference_id TEXT NOT NULL, -- e.g., video_id, artist_id
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_type, reference_id) -- One award per user per item
);

-- Indexes
CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_transactions_user ON points_transactions(user_id);
CREATE INDEX idx_transactions_date ON points_transactions(created_at);
CREATE INDEX idx_awarded_user ON points_awarded(user_id);

-- RLS Policies
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_awarded ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions"
  ON points_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Points config is public (read-only)
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view points config"
  ON points_config FOR SELECT
  USING (true);
```

### Service Implementation
```typescript
// src/services/pointsConfigService.ts
export const pointsConfigService = {
  // Award points for activity
  awardPoints: async (
    userId: string,
    activityType: string,
    referenceId: string,
    referenceType: string
  ) => {
    // 1. Check if already awarded
    // 2. Get points value from config
    // 3. Validate activity completion
    // 4. Create transaction record
    // 5. Update user balance
    // 6. Mark as awarded
    // 7. Check for tier upgrade
    // 8. Return new balance and points earned
  },
  
  // Get user's point balance
  getUserPoints: async (userId: string) => { ... },
  
  // Get user's transaction history
  getTransactionHistory: async (userId: string, limit?: number) => { ... },
  
  // Get points breakdown by activity
  getPointsBreakdown: async (userId: string) => { ... },
  
  // Check if user has already earned points for item
  hasEarnedPoints: async (userId: string, activityType: string, referenceId: string) => { ... },
  
  // Calculate and update user tier
  updateUserTier: async (userId: string) => { ... },
  
  // Redeem points (for rewards)
  redeemPoints: async (userId: string, points: number, rewardId: string) => { ... },
  
  // Admin: Update points configuration
  updatePointsConfig: async (activityType: string, pointsValue: number) => { ... }
};
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test points calculation logic
- [ ] Test duplicate award prevention
- [ ] Test tier calculation
- [ ] Test balance accuracy after transactions

### Integration Tests
- [ ] Test complete point earning flow
- [ ] Test points redemption flow
- [ ] Test transaction history recording
- [ ] Test tier upgrades

### E2E Tests
- [ ] User earns points after video watch
- [ ] User earns points after artist rating
- [ ] User receives completion bonus
- [ ] User cannot earn duplicate points
- [ ] Balance updates correctly across sessions
- [ ] Tier upgrades trigger celebration

---

## 📊 Success Metrics

### Key Performance Indicators
- **Average Points Per User:** > 100 points per month
- **Point Earning Rate:** > 80% of active users earn points weekly
- **Tier Distribution:** 40% Bronze, 30% Silver, 20% Gold, 10% Platinum
- **Redemption Rate:** > 50% of users redeem at least 1 reward

---

## 🚀 Implementation Plan

### Phase 1: Core System (Week 1)
- Create database schema
- Implement points award logic
- Build duplicate prevention
- Create transaction recording

### Phase 2: UI & Tracking (Week 1-2)
- Build points display components
- Create transaction history view
- Implement tier system
- Add points notifications

### Phase 3: Testing & Optimization (Week 2)
- Write comprehensive tests
- Optimize database queries
- Add caching layer
- Final QA

---

## 🔗 Dependencies

### Upstream Dependencies
- AUTH-001: User authentication for points tracking
- PROFILE-001: User profiles store points balance

### Downstream Dependencies
- VIDEO-001: Video watching awards points
- RATING-001: Artist ratings award points
- WEEKLY-001: List completion awards points
- REWARDS-001: Points redeemed for rewards

---

## ⚠️ Risks & Mitigation

### Technical Risks
- **Point Gaming:** Mitigation: Duplicate prevention, rate limiting, validation
- **Balance Inconsistency:** Mitigation: Transaction-based updates, audit logs

### Business Risks
- **Point Inflation:** Mitigation: Careful point value calibration, redemption sinks
- **Low Engagement:** Mitigation: Sufficient point rewards, clear progression

---

## ✏️ Notes

- Points are the core engagement mechanic
- All point values configurable by admin
- Complete audit trail for accounting
- Tier system provides long-term progression goals

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
