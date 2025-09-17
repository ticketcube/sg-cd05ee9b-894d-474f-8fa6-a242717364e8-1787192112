## Discovery Dashboard Freeze Fix Plan

This document outlines the plan to resolve the application freeze issue on the `discovery-dashboard` page that occurs after a browser session is restored.

### Root Cause

The freeze is caused by an infinite loop originating from `UserProfileContext.tsx`. The `loadEngagementHistory` function is defined with `useCallback` and an empty dependency array, causing it to have a stale closure over the initial `null` profile state. This leads to a chain reaction of re-renders and unnecessary data fetching on the `discovery-dashboard` page.

### Proposed Changes

The fix involves correcting the dependency arrays of `useCallback` hooks in `src/contexts/UserProfileContext.tsx` to ensure functions do not have stale closures.

**1. File to Modify:** `src/contexts/UserProfileContext.tsx`

**2. Update `loadEngagementHistory`:**
   - **Problem:** The dependency array is `[]`, but the function's logic implicitly relies on the `profile` state when calling `getUserEngagementHistory`.
   - **Solution:** Add `profile` to the dependency array.

   ```typescript
   // Before
   const loadEngagementHistory = useCallback(async (userId: string, profileData?: UserProfile) => {
     // ... function body uses `profile` from state via closure
   }, []);

   // After
   const loadEngagementHistory = useCallback(async (userId: string, profileData?: UserProfile) => {
     // ... function body uses `profile` from state via closure
   }, [profile]); // &lt;-- CORRECTED DEPENDENCY
   ```

**3. Update `retryHistory`:**
   - **Problem:** While this function has dependencies, ensuring `loadEngagementHistory` is stable is key to preventing loops.
   - **Solution:** The current dependencies are correct, but the fix in `loadEngagementHistory` will stabilize its behavior. No change is strictly needed here after the first fix, but we confirm its dependencies are correct.

   ```typescript
   // Stays the same, but its behavior is now correct because `loadEngagementHistory` is stable.
   const retryHistory = useCallback(async (overrideProfile?: UserProfile) => {
       if (!user?.id) return;
       const profileToUse = overrideProfile || profile;
       await loadEngagementHistory(user.id, profileToUse);
   }, [user?.id, profile, loadEngagementHistory]);
   ```

### Implementation Steps

1. Switch to **Standard Mode**.
2. Open `src/contexts/UserProfileContext.tsx`.
3. Apply the dependency array correction to the `loadEngagementHistory` `useCallback` hook.
4. Save the file and observe that the freezing behavior is resolved.
