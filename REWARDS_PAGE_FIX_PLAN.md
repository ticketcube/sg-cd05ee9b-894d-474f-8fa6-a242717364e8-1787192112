# Plan: Fix Rewards Page Errors and Layout Issues

This plan outlines the steps to resolve a cascade of errors affecting the `/september/rewards` page, including type import failures, layout duplication, and debugging obstacles.

## Problem Summary

1.  **Type Import Errors**: The `rewards.tsx` page fails to import `EnrichedWeeklyList` and `EnrichedWeeklyListArtist` from `src/types/weekly.ts`, causing compilation errors. The root cause is likely an issue within `src/types/weekly.ts` or its dependency, `src/types/artists.ts`.
2.  **Duplicate Layout Rendering**: `_app.tsx` wraps all pages in `AppLayout`, but `rewards.tsx` *also* wraps its content in `AppLayout`. This results in nested layouts, invalid HTML, and unpredictable behavior.
3.  **Error Masking**: `AppLayout.tsx` contains a global error handler that immediately redirects to the homepage on any error. This prevents developers from seeing critical error messages in the console, making debugging nearly impossible.
4.  **Minor Bug**: The user avatar in `AppLayout.tsx` is hardcoded to the site logo instead of displaying the user's actual avatar.

## Step-by-Step Fixes

### Step 1: Fix Core Layout Architecture

The duplicate layout is the most critical architectural flaw and should be fixed first.

1.  **Modify `src/pages/september/rewards.tsx`**:
    *   Remove the `<AppLayout>` wrapper from this page. The page component should return its direct content, not the entire layout.
2.  **Modify `src/pages/_app.tsx`**:
    *   Ensure it remains the single source of truth for applying `AppLayout`. No changes are likely needed here, but the fix in `rewards.tsx` depends on its current behavior.

### Step 2: Improve Debuggability and Fix Bugs in `AppLayout`

The error masking must be disabled to diagnose the underlying type errors.

1.  **Modify `src/components/layout/AppLayout.tsx`**:
    *   **Remove the Global Error Handler**: Delete the `useEffect` hook that adds `error` and `unhandledrejection` event listeners. This will allow errors to appear in the browser console as expected.
    *   **Fix User Avatar**: Update the `Image` component for the user avatar to use `profile.avatar_url` from the `useUserProfile` hook, with a fallback. The `profile` object already contains this information.

### Step 3: Diagnose and Fix Type Definition Errors

With the layout fixed and error masking removed, we can now properly address the type import errors.

1.  **Analyze `src/types/weekly.ts`**:
    *   The import statement `import { Artist } from './artists';` is placed unconventionally after an export. All imports should be moved to the top of the file for clarity and to follow best practices.
2.  **Investigate `src/types/artists.ts`**:
    *   The problem likely originates here. We need to open this file and check:
        *   Is the `Artist` type correctly defined and exported?
        *   Are there any syntax errors in the file that would prevent it from being parsed?
3.  **Apply Fixes**:
    *   Correct any errors found in `src/types/artists.ts`.
    *   Clean up the import order in `src/types/weekly.ts`.

By following these steps, we will resolve the structural problems, restore proper error reporting, and then fix the specific type-related issues that are blocking development.