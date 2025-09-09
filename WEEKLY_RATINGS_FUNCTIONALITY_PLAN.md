# Weekly Ratings Page: Detailed Functionality Plan

**Objective:** To make the `weekly-ratings` page fully functional, focusing on correct data flow, video playback, and rating submission without renaming existing files.

---

### **Problem Analysis**

The `weekly-ratings` page is currently experiencing functional issues due to a disconnect between the frontend implementation and recent backend API enhancements. The primary problems are:

1.  **Outdated Data Fetching:** The frontend performs two separate client-side Supabase queries (one for lists, one for artists per list). A recent commit introduced a more efficient API endpoint (`/api/weekly-lists/active`) that provides all this data in a single call, but the frontend isn't using it.
2.  **Inconsistent Data Properties:** Recent refactoring has changed property names for video URLs (e.g., from `artist_videolink` to `video_url` or `videoUrl`). The frontend components may be referencing outdated property names, preventing videos from loading.
3.  **Complex State Management:** The separation of `weeklyLists` and `artists` state adds unnecessary complexity and loading states, which can be simplified with the new API structure.

---

### **Phase 1: Modernize Data Fetching**

**Goal:** Align the frontend data fetching logic with the new, efficient backend API.

**File to Modify:** `src/services/septemberRewardsService.ts`

1.  **Create a New Service Method:**
    *   Add a new asynchronous method: `getActiveEnrichedWeeklyLists`.
    *   This method will make a single `fetch` request to the `/api/weekly-lists/active` API endpoint.
    *   It will parse the JSON response and return the data, which is expected to be an array of `EnrichedWeeklyList` objects (each containing a nested `artists` array).
    *   The existing methods `getActiveWeeklyLists` and `getArtistsForWeeklyList` will be marked for deprecation or removed to avoid future use.

**File to Modify:** `src/pages/weekly-ratings.tsx`

1.  **Refactor State:**
    *   Remove the separate `weeklyLists` and `artists` state variables.
    *   Create a single state variable: `const [enrichedLists, setEnrichedLists] = useState&lt;EnrichedWeeklyList[]&gt;([]);`. (The type `EnrichedWeeklyList` will need to be imported or defined based on the API response).
    *   Keep the `selectedListId` state to track the user's dropdown selection.

2.  **Update Data Loading `useEffect`:**
    *   Modify the initial `useEffect` to call the new `septemberRewardsService.getActiveEnrichedWeeklyLists()` method once when the component mounts.
    *   Store the result in the `enrichedLists` state.
    *   Upon successful data load, automatically set `selectedListId` to the ID of the first list in the array (`enrichedLists[0]?.id.toString()`), which will trigger the artist grid to render.

3.  **Simplify Artist Display Logic:**
    *   Remove the `useEffect` that previously fetched artists when `selectedListId` changed.
    *   Instead, derive the artists to display directly from the state. Create a variable inside the component render logic:
        ```javascript
        const currentArtists = enrichedLists.find(list =&gt; list.id.toString() === selectedListId)?.artists || [];
        ```
    *   Pass this `currentArtists` variable to the `<SeptemberArtistGrid />` component. This eliminates the second network request and loading state.

---

### **Phase 2: Ensure Correct Video Playback**

**Goal:** Fix issues with video playback by ensuring data consistency between the data source and the video player component.

**File to Modify:** `src/components/september/SeptemberVideoPopup.tsx` (and potentially `ArtistVideoPlayer.tsx`)

1.  **Identify Video URL Property:**
    *   The data returned from `/api/weekly-lists/active` likely contains the video URL under a property like `video_url`. The `ArtistVideoPlayer` component was recently updated to expect a prop named `videoUrl`.

2.  **Map the Prop Correctly:**
    *   Inside `SeptemberVideoPopup.tsx`, locate where `<ArtistVideoPlayer />` is rendered.
    *   The `artist` object passed to the popup will have the video URL from the API (e.g., `artist.video_url`).
    *   Ensure the prop is correctly passed to the player:
        ```jsx
        // Assuming the artist object from the API has 'video_url'
        &lt;ArtistVideoPlayer videoUrl={artist.video_url} /&gt;
        ```
    *   This simple mapping ensures the player component receives the `videoUrl` prop it now expects, fixing video playback. Also, ensure the correct type is being used for the artist object, which is now `EnrichedWeeklyListArtist` from `src/types/weekly.ts` instead of `WeeklyListArtist` from the service.

---

### **Phase 3: Verify Rating Submission**

**Goal:** Confirm the end-to-end rating submission flow is functional and secure.

**Files to Review:** `src/pages/api/user/engagement.ts` and `src/services/userEngagementService.ts`

1.  **No Changes Needed, Verification Only:**
    *   The current implementation, where the frontend calls an API route to record the engagement, is the correct and secure pattern. The API route uses the `supabaseAdmin` client, which correctly bypasses RLS to write to the database.
    *   The data being passed (`userId`, `artistUuid`, `weekIdentifier`, quadrant data) appears correct.
    *   This part of the functionality should already be working as intended. The focus of implementation will be on the data fetching and display (Phases 1 and 2), which are the likely points of failure.

---

This detailed plan provides a clear path to fixing the `weekly-ratings` page by focusing on the core functionality issues. By implementing these changes, the page will be faster, more reliable, and correctly structured to work with the existing backend APIs.
