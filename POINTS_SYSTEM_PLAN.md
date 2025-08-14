
# OTWChart Points System - Complete Implementation Plan

## Current System Status

### Database-Driven Configuration ✅
- **Points Configuration Table**: `points_config` table stores all point values and rules
- **Caching**: 5-minute cache for performance optimization
- **Dynamic Updates**: Point values can be changed without code deployment

### Core Services Implemented ✅
1. **PointsConfigService**: Database-driven configuration management
2. **WeeklyVotingService**: Handles voting and video view points
3. **VideoWatchService**: Tracks video progress and completion bonuses
4. **UserProfileService**: Records achievements and updates user points

---

## Points Allocation Structure

### 1. Video View Points 🎥
- **Points**: Configurable via database (default: 5 points)
- **Minimum Watch Time**: Configurable (default: 15 seconds)
- **Frequency**: `once_per_artist_per_week`
- **Eligibility**: Available ALWAYS (no voting window restrictions)
- **Logic**: User can earn points for watching Laufey in Week 30, then again if Laufey appears in Week 35

### 2. Vote Submission Points 🗳️
- **Points**: Configurable via database (default: 10 points)
- **Frequency**: `once_per_week`
- **Eligibility**: Only during voting windows (between start_date and end_date)
- **Types**: Both ranking and quadrant voting earn same points

### 3. Video Completion Bonus 🏆
- **Points**: Configurable via database (default: 15 points)
- **Trigger**: Watch ALL videos in a weekly list (meets minimum time)
- **Frequency**: `once_per_week`
- **UI Requirement**: Show completion progress (e.g., "3/5 videos watched")

### 4. Weekly Streak Bonus 🔥 (Phase 2)
- **Points**: Configurable via database (default: 25 points)
- **Trigger**: Vote in consecutive weeks
- **Frequency**: `unlimited` (each consecutive week earns bonus)
- **Implementation**: Track via `user_streaks` table

### 5. Referral Bonus 🤝 (Phase 2)
- **Points**: Configurable via database (default: 25 points)
- **Trigger**: Referred friend completes first vote
- **Frequency**: `unlimited`
- **Security**: Needs fraud detection and validation

---

## Frequency Rules & Eligibility System

### Supported Frequency Types
```typescript
'once' // One time ever
'once_per_week' // Once per week identifier
'once_per_artist_lifetime' // Once per artist, ever
'once_per_artist_per_week' // Once per artist per week
'unlimited' // No restrictions
```

### Video Watch Eligibility ⭐
**Key Innovation**: Video points are ALWAYS available, regardless of voting status

```typescript
// Video watching works like this:
// Week 30: Laufey, Billie Eilish, Taylor Swift, Drake, Bad Bunny
// User watches Laufey (15+ seconds) → Earns 5 points
// User tries to watch Laufey again → No additional points (once per artist per week)
// Week 35: Laufey appears again → User can earn 5 more points for Laufey

// Voting closed for Week 30? → Video points still available!
// This allows fans to discover and earn points even after voting ends
```

### Voting vs Video Windows
- **Voting Points**: Restricted by `start_date` and `end_date` in `weekly_lists`
- **Video Points**: Always available, no time restrictions
- **Completion Bonus**: Always available (based on video watching, not voting)

---

## Timer & Watch Tracking Logic

### Video Player Integration
```typescript
// Example implementation for video player
const trackVideoWatch = async (artistUuid: string, watchTime: number) => {
  const result = await weeklyVotingService.recordVideoView({
    userId: currentUser.id,
    artistUuid: artistUuid,
    weekIdentifier: currentWeekIdentifier,
    watchTimeSeconds: watchTime
  });
  
  // Update UI based on result
  if (result.pointsEarned > 0) {
    showPointsNotification(`+${result.pointsEarned} points!`);
  }
  
  // Always update watch status (even if no points earned)
  updateVideoWatchStatus(artistUuid, watchTime);
};
```

### UI Status Indicators
- ✅ **Green Checkmark**: Video watched (meets minimum time)
- ⏱️ **Progress Indicator**: Shows current progress vs minimum (e.g., "8/15 seconds")
- 🏆 **Bonus Available**: Shows when completion bonus is ready
- 💰 **Points Earned**: Shows total points from video watching

---

## Database Structure Requirements

### Points Config Table Structure ✅
```sql
CREATE TABLE points_config (
  id SERIAL PRIMARY KEY,
  action_name TEXT UNIQUE NOT NULL, -- 'video_view', 'vote_submission', etc.
  points_value INTEGER NOT NULL, -- Points awarded
  min_value INTEGER DEFAULT 0, -- Minimum requirement (seconds, etc.)
  frequency TEXT DEFAULT 'once', -- Frequency rule
  description TEXT, -- Human-readable description
  is_active BOOLEAN DEFAULT true, -- Enable/disable point type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Required Seed Data
```sql
INSERT INTO points_config (action_name, points_value, min_value, frequency, description) VALUES
('video_view', 5, 15, 'once_per_artist_per_week', 'Points for watching artist video (15+ seconds)'),
('vote_submission', 10, 0, 'once_per_week', 'Points for submitting weekly votes'),
('video_completion_bonus', 15, 0, 'once_per_week', 'Bonus for watching all videos in weekly list'),
('weekly_streak', 25, 2, 'unlimited', 'Bonus for consecutive weeks of voting'),
('referral_bonus', 25, 0, 'unlimited', 'Points for successful referrals');
```

---

## Security & RLS Requirements

### Row Level Security (RLS) Setup
```sql
-- Enable RLS for points_config (read-only for users)
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;

-- Allow all users to read points configuration
CREATE POLICY "Users can view points config" 
ON points_config FOR SELECT 
USING (true);

-- Only allow authenticated admins to modify
CREATE POLICY "Only admins can modify points config" 
ON points_config FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Implementation Phases

### Phase 1: Core System (Current) ✅
- [x] Database-driven points configuration
- [x] Video view tracking (once per artist per week)
- [x] Vote submission points (once per week)  
- [x] Video completion bonus (watch all videos)
- [x] Points configuration service with caching
- [x] Video watch status tracking service

### Phase 1.5: UI Enhancements (Next)
- [ ] Video watch progress indicators
- [ ] Completion bonus progress bar
- [ ] Points notification system
- [ ] "How Points Work" popup/modal
- [ ] Weekly points summary dashboard

### Phase 2: Advanced Features
- [ ] Weekly voting streak bonuses
- [ ] Referral system with fraud protection
- [ ] Leaderboards and point statistics
- [ ] Point redemption/rewards system
- [ ] Advanced analytics and reporting

---

## UI/UX Recommendations

### 1. Points Explanation Modal 📚
**Requirement**: Popup that explains how points work
**Trigger**: First visit + available via help icon
**Content**:
- Video watching rules (15 seconds minimum)
- Voting points availability
- Completion bonus explanation
- Frequency limitations explained simply

### 2. Video Watch Indicators 🎯
**Implementation**: Update video player components
```typescript
// Video component shows:
<VideoPlayer>
  <WatchStatus 
    hasWatched={watchStatus.hasWatched}
    meetsMinimum={watchStatus.meetsMinRequirement}
    earnedPoints={watchStatus.earnedPoints}
    watchTime={watchStatus.watchTimeSeconds}
    minTime={15}
  />
</VideoPlayer>
```

### 3. Progress Dashboard 📊
**Location**: Weekly voting page
**Shows**:
- Videos watched this week (3/5)
- Points earned this week
- Completion bonus status
- Next week preview

### 4. Notification System 🔔
**Triggers**:
- Points earned (+5 points!)
- Completion bonus ready (🏆 Bonus available!)
- New week available
- Streak bonuses earned

---

## Technical Implementation Notes

### Service Architecture
```
PointsConfigService (Database config + caching)
    ↓
WeeklyVotingService (Voting + video points)
VideoWatchService (Status tracking + progress)
    ↓
UserProfileService (Achievement recording + point updates)
```

### Error Handling Strategy
- Graceful degradation if points config unavailable
- Retry logic for point award failures
- Comprehensive logging for debugging
- User-friendly error messages

### Performance Considerations
- 5-minute cache for points configuration
- Batch video status checks where possible
- Efficient metadata queries with proper indexing
- Pagination for large achievement lists

---

## Future-Proofing for New Features

### Modular Point Types
New point types can be added by:
1. Adding row to `points_config` table
2. No code changes required for basic functionality
3. Custom logic only needed for complex eligibility rules

### Plugin Architecture Ready
```typescript
// Future: Custom point calculators
interface PointCalculator {
  calculatePoints(action: string, context: any): Promise<number>;
  checkEligibility(action: string, userId: number, context: any): Promise<boolean>;
}
```

### Analytics Integration
Current structure supports easy analytics:
- Track point earning patterns
- Identify popular content
- Measure engagement effectiveness
- A/B test different point values

---

## Success Metrics

### User Engagement
- Videos watched per user per week
- Completion bonus earn rate
- Return visitor rate
- Average time spent on site

### Points System Health
- Point distribution fairness
- Gaming/abuse detection
- Configuration change impact measurement
- User satisfaction with point rewards

---

## Migration Strategy

### Existing Data
- Legacy hard-coded points can be migrated
- Historical achievements remain valid
- Gradual rollout of new features possible

### Backwards Compatibility
- Old API endpoints continue to work
- Progressive enhancement of UI components
- Feature flags for controlled deployment

---

## Conclusion

This points system is designed to be:
- **Flexible**: Database-driven configuration
- **Engaging**: Always-available video points + bonuses
- **Scalable**: Modular architecture supports new features
- **Secure**: RLS protection + fraud prevention ready
- **User-Friendly**: Clear rules + progress indicators

The core foundation is solid and ready for immediate deployment, with a clear roadmap for enhanced features.
