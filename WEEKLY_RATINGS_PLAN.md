## Weekly Ratings Page: Plan for Functionality

The `weekly-ratings` page is currently non-functional due to a mismatch between frontend expectations and API capabilities, along with legacy naming from a previous feature. This plan outlines the necessary steps to create a robust and scalable weekly ratings system.

### Phase 1: API & Service Layer Refactoring

The core of the problem is in the data flow. We will create a more standard REST-like API structure.

1.  **Rename the Service:**
    -   [ ] Rename `src/services/septemberRewardsService.ts` to `src/services/weeklyRatingsService.ts`.
    -   [ ] Update all internal references and method names if they are September-specific.

2.  **Create New API for Listing Weeks:**
    -   [ ] Create a new file: `src/pages/api/weekly-lists/index.ts`.
    -   [ ] This endpoint will handle `GET` requests.
    -   [ ] It should query the `weekly_lists` table and return an array of all lists with `status: 'active'`.
    -   [ ] This will be used to populate the week selection dropdown on the frontend.
    -   [ ] The `getActiveWeeklyLists` method in the newly renamed `weeklyRatingsService` will be updated to call this new endpoint.

3.  **Create New API for Fetching Artists:**
    -   [ ] Create a new file: `src/pages/api/weekly-lists/[listId].ts`.
    -   [ ] This dynamic endpoint will handle `GET` requests and extract the `listId` from the query.
    -   [ ] It should fetch the artists associated with that `listId` from the `weekly_list_artists` table, joining the `artists` table to get details like name, image, and `video_url`.
    -   [ ] The `getArtistsForWeeklyList` method in `weeklyRatingsService` will be updated to call this endpoint.

4.  **Deprecate Old API:**
    -   [ ] Once the new APIs are confirmed to be working, delete the old `src/pages/api/weekly-lists/active.ts` file.

### Phase 2: Frontend Component Refactoring

We need to remove all "September" specific naming to make the components reusable.

1.  **Rename Page Component:**
    -   [ ] In `src/pages/weekly-ratings.tsx`, rename the React component from `SeptemberRewards` to `WeeklyRatingsPage`.

2.  **Rename Child Components:**
    -   [ ] Rename `src/components/september/SeptemberArtistGrid.tsx` to `src/components/weekly-ratings/WeeklyArtistGrid.tsx`.
    -   [ ] Rename `src/components/september/SeptemberVideoPopup.tsx` to `src/components/weekly-ratings/WeeklyVideoPopup.tsx`.
    -   [ ] Rename `src/components/september/SeptemberRatingPopup.tsx` to `src/components/weekly-ratings/WeeklyRatingPopup.tsx`.
    -   [ ] Create a new folder `src/components/weekly-ratings/` to house these components.

3.  **Update Imports:**
    -   [ ] In `src/pages/weekly-ratings.tsx`, update all imports to point to the renamed service (`weeklyRatingsService`) and the renamed components in their new location.

### Phase 3: Final Integration & Cleanup

1.  **Connect Frontend to New APIs:**
    -   [ ] Verify that `weekly-ratings.tsx` correctly uses the service methods that call our new, separated APIs for fetching lists and then artists. The existing logic should align well with this new structure.

2.  **Clean Up Data Types:**
    -   [ ] In `src/types/weekly.ts`, review the `EnrichedWeeklyListArtist` type.
    -   [ ] Remove redundant fields like `artist_videolink` if `video_url` is the standard.
    -   [ ] Ensure the artist data being returned from the API matches the frontend type.

3.  **End-to-End Testing:**
    -   [ ] Manually test the entire user flow:
        1.  Page loads, dropdown is populated with weeks.
        2.  Selecting a week loads the correct artist grid.
        3.  Clicking an artist opens the video popup and plays the video.
        4.  After the video, the rating popup appears.
        5.  Submitting a rating correctly awards points and closes the popups.
