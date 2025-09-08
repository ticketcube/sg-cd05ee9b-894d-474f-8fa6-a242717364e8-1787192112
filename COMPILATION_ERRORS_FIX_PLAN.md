# COMPILATION ERRORS FIX PLAN

## Overview
Systematic plan to resolve ~80 TypeScript compilation errors before continuing with AUTH_RLS_REFACTOR_PLAN.

## Error Categories & Impact

### A.1: Display Name Issues (15+ errors)
**Problem**: `display_name` property required but missing on artist objects
**Files Affected**:
- src/components/ArtistChart.tsx
- src/components/Top100ArtistPopup.tsx
- src/components/UnifiedArtistPopup.tsx
- src/components/VibeChart.tsx
- src/components/WeeklyArtistPopup.tsx
- src/components/WeeklyArtistRatingPopup.tsx
- src/pages/all-artists.tsx
- src/pages/genres/[genre].tsx
- src/pages/top100.tsx

**Solution**: Make `display_name` optional in DisplayArtist interface

### A.2: Import/Export Mismatches (12+ errors)
**Problem**: Components using named imports but exports are default
**Files Affected**:
- src/pages/discovery-dashboard.tsx (all dashboard component imports)
- src/pages/weekly-ratings.tsx (multiple component imports)
- src/components/weekly/WeeklyRewardsHeader.tsx
- src/components/WeeklyArtistPopup.tsx
- src/components/points/WeeklyPointsDashboard.tsx

**Solution**: Fix import statements or change export patterns

### A.3: Database Schema Mismatches (20+ errors)
**Problem**: References to columns that don't exist in current database
**Files Affected**:
- src/services/weeklyListService.ts (column name errors)
- src/services/weeklyVotingService.ts (column name errors)
- src/components/weekly/* (property name mismatches)
- src/hooks/useWeeklyLists.ts
- src/pages/discovery-dashboard.tsx

**Solution**: Update column references to match actual database schema

### A.4: Missing Type Exports (8+ errors)
**Problem**: Types declared but not exported from service files
**Files Affected**:
- src/services/weeklyVotingService.ts (SubmissionResult)
- src/services/weeklyListService.ts (WeeklyListWithEnrichedArtists)
- src/types/weekly.ts (EnrichedWeeklyListArtist)
- src/hooks/useWeeklyListDetail.ts
- src/integrations/supabase/types.ts (WeeklyList)

**Solution**: Export missing types and interfaces

### A.5: Property Mismatches (15+ errors)
**Problem**: Components expecting properties that don't exist on types
**Files Affected**:
- Weekly components (artist_id vs artist_uuid, profile_image_url, has_watched)
- Points system (user_has_watched_video vs user_has_watched)
- Dashboard components (points property missing)
- Genre pages (vote_count vs votes/total_votes)

**Solution**: Update property references to match actual data structure

## Implementation Steps

### Step 1: Fix Display Name Type Issue ⭐ (HIGH IMPACT)
```typescript
// In src/types/artists.ts
export interface DisplayArtist extends Artist {
    display_name?: string; // Make optional
    is_featured?: boolean;
}
```
**Expected**: Fixes 15+ errors immediately

### Step 2: Fix Component Export Patterns
Update all dashboard components to use consistent export pattern:
- DashboardHeader.tsx
- HeroVideo.tsx
- TabNavigation.tsx
- DiscoverMoreTab.tsx
- MoreRewardsTab.tsx
- DashboardLoading.tsx
- DashboardAuthBlock.tsx

### Step 3: Export Missing Types
```typescript
// In src/services/weeklyVotingService.ts
export interface SubmissionResult {
    success: boolean;
    error?: string;
    pointsAwarded?: number;
}

// In src/services/weeklyListService.ts
export interface WeeklyListWithEnrichedArtists {
    // ... type definition
}

// In src/types/weekly.ts
export interface EnrichedWeeklyListArtist extends WeeklyListArtist {
    // ... additional properties
}
```

### Step 4: Fix Database Column References
Update old column names to current schema:
- `name` -> `title` (in weekly_lists)
- `ticket_interest`/`share_interest` -> correct column names
- `artist_id` -> `artist_uuid`
- `profile_image_url` -> correct property name
- `user_has_watched_video` -> `user_has_watched`

### Step 5: Fix Import Statements
Update import statements throughout the application:
```typescript
// Change from:
import { AppLayout } from '@/components/layout/AppLayout';
// To:
import AppLayout from '@/components/layout/AppLayout';
```

## Success Criteria
- ✅ Zero TypeScript compilation errors
- ✅ All imports resolve correctly
- ✅ All type references are valid
- ✅ Database queries use correct column names
- ✅ Ready to continue with AUTH_RLS_REFACTOR_PLAN Phase 1.3

## Next Phase
After completion, return to AUTH_RLS_REFACTOR_PLAN Phase 1.3: Update AppLayout Loading States