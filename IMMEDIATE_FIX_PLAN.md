# Plan: Immediate Fixes for Weekly Ratings

This plan focuses on two critical tasks to get the `weekly-ratings` page functional, as per the user's request.

### Objective 1: Update API to Load All Active Weeks

The goal is to modify the existing `active.ts` API to fetch all active weekly lists, not just one.

**Tasks:**

1.  **Modify `src/pages/api/weekly-lists/active.ts`:**
    -   [ ] Open the file.
    -   [ ] Remove the `.limit(1)` and `.single()` modifiers from the Supabase query that fetches from `weekly_lists`.
    -   [ ] The query should now fetch all records where `status` is `'active'`.
    -   [ ] The query should be structured to embed related artists:
        ```typescript
        // Example query structure
        const { data, error } = await supabase
          .from('weekly_lists')
          .select(`
            *,
            weekly_list_artists (
              *,
              artists (
                *
              )
            )
          `)
          .eq('status', 'active');
        ```
    -   [ ] Adjust the data mapping logic to handle an array of lists instead of a single object. The API's final output should be `WeeklyList[]`.

### Objective 2: Standardize `artist_videolink`

The goal is to ensure the video URL is consistently sourced from `public.artists.artist_videolink` and named consistently throughout the app.

**Note on Data Model:** The `artist_videolink` field should **not** be added to the `weekly_list_artists` table. It is an attribute of the artist and is correctly sourced by joining the `artists` table.

**Tasks:**

1.  **Update API Response in `active.ts`:**
    -   [ ] In the data mapping logic, ensure the field for the video URL is named `artist_videolink`.
    -   [ ] The current code maps `artists.artist_videolink` to a `video_url` property. Change this so the output property is also `artist_videolink`.

2.  **Update TypeScript Type in `src/types/weekly.ts`:**
    -   [ ] Open the file.
    -   [ ] In the `EnrichedWeeklyListArtist` type (or similar), find the `video_url?: string;` property.
    -   [ ] Rename it to `artist_videolink?: string;`.

3.  **Update `ArtistVideoPlayer` Component:**
    -   [ ] Open `src/components/ArtistVideoPlayer.tsx`.
    -   [ ] Change the incoming prop name from `videoUrl` to `artist_videolink`.
    -   [ ] Update the component's internal logic to use the new prop name.

4.  **Update `SeptemberVideoPopup` Component (or its equivalent):**
    -   [ ] Open `src/components/september/SeptemberVideoPopup.tsx`.
    -   [ ] Find where it renders `<ArtistVideoPlayer>`.
    -   [ ] Change the prop being passed from `videoUrl={...}` to `artist_videolink={...}`.
    -   [ ] Ensure the data it receives is correctly passed down.

5.  **Update `weekly-ratings.tsx` Page:**
    -   [ ] Open `src/pages/weekly-ratings.tsx`.
    -   [ ] Find where the video popup component is rendered.
    -   [ ] When an artist is selected (`handleArtistClick`), ensure it passes `selectedArtist.artist_videolink` to the popup.

This focused approach will deliver a working feature while adhering to scalable practices. Once you're ready to proceed, I can begin implementing these changes.
