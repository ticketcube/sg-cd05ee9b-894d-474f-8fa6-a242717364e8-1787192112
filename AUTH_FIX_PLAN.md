
# Authentication State Synchronization Fix Plan

## 1. The Problem

There is a race condition between the authentication callback and the rendering of components that depend on the user's profile.

-   `/auth/callback` correctly establishes a session and redirects to `/discovery-dashboard`.
-   `UserProfileContext` begins fetching the user and profile.
-   The context sets its `loading` state to `false` *after* the session is confirmed, but *before* the `profile` data has been fetched from the database.
-   `AppLayout` and `discovery-dashboard` render with `loading: false` and `profile: null`, causing them to display the UI for a logged-out user.

## 2. The Solution

The `loading` state in `UserProfileContext` must be more comprehensive. It should only be set to `false` after all necessary user data, including the database profile, has been fetched.

## 3. Implementation Steps

### Step 1: Modify `src/contexts/UserProfileContext.tsx`

The primary change is to adjust when `setLoading(false)` is called.

-   In the `useEffect` hook that runs on mount (`getSessionAndProfile`) and in the `onAuthStateChange` listener, move `setLoading(false)` to be inside the `try/catch` block, *after* the `setProfile` calls have resolved.
-   This ensures the `loading` state persists until the profile is either successfully fetched or an error occurs.

### Step 2: Refine `src/components/layout/AppLayout.tsx`

-   To improve consistency, the `AppLayout` should rely on the `isAuthenticated` flag from `useUserProfile` instead of the `user` object from `useUser`. This consolidates our "source of truth" for the user's auth status.

This will resolve the visual bug and ensure the UI accurately reflects the user's authentication state upon arriving at the dashboard.

