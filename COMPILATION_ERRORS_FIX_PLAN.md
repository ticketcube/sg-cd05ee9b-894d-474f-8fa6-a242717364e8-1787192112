# Compilation Errors Fix Plan

## Overview
This plan addresses the ~80 TypeScript compilation errors in the project systematically, focusing on the most impactful fixes first.

## Step 1: Quick Artist Types Fix ✅ COMPLETE
**Status**: COMPLETE
**Impact**: Fixed display_name property issues across multiple files

## Step 2: Import/Export Fixes - UserProfileService ✅ COMPLETE
**Status**: COMPLETE  
**Impact**: Fixed major import pattern issues in UserProfileContext and related files

## Step 3: Type Export Missing in Weekly Service
**Files**: 
- `src/services/weeklyListService.ts` - Export missing `WeeklyListWithEnrichedArtists`
- `src/services/weeklyVotingService.ts` - Export missing `SubmissionResult`

**Fix**: Add proper exports:
```typescript
// In weeklyListService.ts
export type WeeklyListWithEnrichedArtists = /* existing type definition */;

// In weeklyVotingService.ts  
export interface SubmissionResult {
  success: boolean;
  pointsAwarded: number;
  error?: string;
}
```

## Step 4: Service Import Pattern Fixes ✅ COMPLETE
**Status**: COMPLETE
**Files Fixed**:
- ✅ `src/components/WeeklyArtistPopup.tsx` 
- ✅ `src/components/points/WeeklyPointsDashboard.tsx`

## Step 5: Component Export Patterns
**Status**: PENDING
**Impact**: HIGH - Fixes ~15 component import errors

**Files Needing Default Exports**:
- `src/components/layout/AppLayout.tsx`
- `src/components/dashboard/DashboardHeader.tsx`  
- `src/components/dashboard/HeroVideo.tsx`
- `src/components/dashboard/TabNavigation.tsx`
- `src/components/dashboard/DiscoverMoreTab.tsx`
- `src/components/dashboard/MoreRewardsTab.tsx`
- `src/components/dashboard/DashboardLoading.tsx`
- `src/components/dashboard/DashboardAuthBlock.tsx`
- `src/components/points/HowPointsWorkModal.tsx`
- `src/components/WeeklyArtistRatingPopup.tsx`
- `src/components/points/SubmissionSuccessPopup.tsx`
- `src/components/weekly/WeeklyRewardsHeader.tsx`

**Action Required**: Change all from `export function ComponentName` to `export default function ComponentName`

## Step 6: Supabase Function Parameter Consistency
**Priority**: Medium (will come up naturally during database work)
**Status**: PENDING

**Scope**: Review and standardize all Supabase database functions for parameter naming consistency

**Background**: 
- The `p_` prefix in PostgreSQL function parameters is a naming convention for clarity
- Prevents name conflicts when parameter names match column names  
- `increment_user_points` was changed to remove p_ prefix, other functions may need consistency

**Functions to Review**:
- `increment_user_points` (already updated - no p_ prefix)
- All other RPC functions in Supabase database
- Ensure consistent parameter naming across all functions

**Decision Needed**:
- **Option A**: Add p_ prefix to all functions (recommended for SQL clarity)  
- **Option B**: Remove p_ prefix from all functions (current increment_user_points style)

**When to Address**: During database function calls in error fixing, or as cleanup task after core compilation errors are resolved.

## Step 7: Database Schema Alignment
**Impact**: MEDIUM - Fixes property access errors

**Property Mismatches**:
- `user_has_watched_video` vs `user_has_watched` 
- `artist_id` vs `artist_uuid`
- `profile_image_url` missing
- `is_active` vs `status` field
- Column name mismatches in weekly_votes table

**Action Required**: Verify actual database schema and update TypeScript types accordingly.

## Step 8: Function Signature Mismatches  
**Impact**: MEDIUM

**Issues**:
- `updateRating` function signature mismatch (3 params expected, 6 provided)
- `submitRating` return type mismatches
- Component prop interfaces not matching actual usage

## Step 9: Toast System Fix
**Impact**: LOW
**Issue**: `@/components/ui/use-toast` import not found
**Fix**: Update import path to correct toast hook location

## Estimated Fix Order
1. ✅ Steps 1-4: COMPLETE (~40 errors fixed)
2. Step 5: Component Exports (~15 errors) 
3. Step 3: Type Exports (~10 errors)
4. Step 7: Schema Alignment (~10 errors)
5. Step 8: Function Signatures (~8 errors)  
6. Step 6: Database Parameters (as needed)
7. Step 9: Toast System (~2 errors)

**Total Estimated**: ~80+ errors → 0 errors
