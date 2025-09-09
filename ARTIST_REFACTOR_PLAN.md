# Artist Type Refactoring Plan

## 1. Objective

This plan outlines the necessary code changes to align the entire application with the new, schema-derived `Artist` type located in `src/types/artists.ts`. The previous `Artist` type used different property names (e.g., `name`, `genre`), and this refactor will correct all files that still reference those outdated properties.

## 2. The Core Problem: Property Name Mismatch

The `Artist` type is now sourced directly from the `artists` table schema.

-   **Old Property Name:** `name`, `genre`, `home`, `imageUrl`, `tiktokHandle`
-   **New Correct Property Name:** `artist_name`, `artist_genre`, `artist_home`, `artist_image`, `artist_tiktok_username`

All services, components, and pages must be updated to use the new property names.

## 3. File-by-File Action Plan

### `src/services/artistService.ts` (Critical)

This service has multiple queries that will fail or behave incorrectly.

-   **`getArtistsByGenre`**:
    -   **Change**: `.eq("primary_genre", genre)`
    -   **To**: `.eq("artist_genre", genre)`
-   **`getRelatedArtists`**:
    -   **Change**: `mainArtist.related_artists` (this is correct) and `.in("name", relatedArtistNames)`
    -   **To**: `.in("artist_name", relatedArtistNames)`
    -   **Change**: `artist.name`
    -   **To**: `artist.artist_name`
-   **`getGenreCounts`**:
    -   **Change**: `select("primary_genre")`
    -   **To**: `select("artist_genre")`
    -   **Change**: `artist.primary_genre`
    -   **To**: `artist.artist_genre`
-   **`getArtistsWithTikTok`**:
    -   **Change**: `.not("tiktok_handle", "is", null)`
    -   **To**: `.not("artist_tiktok_username", "is", null)`
    -   **Change**: `.not("tiktok_video_id", "is", null)`
    -   **To**: `.not("artist_tiktok_videoid", "is", null)`
-   **`getTopArtistsByListeners`**:
    -   **Change**: `.order("spotify_monthly_listeners", ...)`
    -   **To**: `.order("artist_totallisteners", ...)`
-   **`getTop100ArtistsSortedByVotes`**:
    -   **Change**: `a.name.localeCompare(b.name)`
    -   **To**: `a.artist_name.localeCompare(b.artist_name)`

### `src/services/septemberRewardsService.ts`

This service has redundant types that must be removed.

-   **Action**: Delete the local `WeeklyListArtist` and `SeptemberArtist` interface definitions.
-   **Action**: Import the `Artist` type from `src/types/artists.ts`.
-   **Action**: Change the return type of `getArtistsForWeeklyList` to `Promise<Artist[]>`.
-   **Action**: Change the return type of `getSeptemberArtists` to `Promise<Artist[]>`.

### Component-Level Changes

The following components receive `artist` objects as props. Their internal logic must be updated to use the new property names.

-   **`src/components/september/SeptemberArtistGrid.tsx`**
    -   **Check**: How `artist.artist_name` and `artist.artist_image` are used. It is likely using old properties.
-   **`src/components/september/SeptemberVideoPopup.tsx`**
    -   **Check**: Access to `artist.artist_name` and `artist.artist_videolink`.
-   **`src/components/september/SeptemberRatingPopup.tsx`**
    -   **Check**: Access to `artist.artist_name` and `artist.uuid`.

### API Route Changes

-   **`src/pages/api/weekly-lists/active.ts`**
    -   **Action**: This API endpoint constructs the `EnrichedWeeklyList` object that is consumed by the `septemberrewards.tsx` page. We must verify that the `artists` array within the response is built using the correct, new `Artist` schema properties. Any manual object creation must be updated.

## 4. Implementation Steps

1.  Switch to **Standard Mode**.
2.  Follow this plan to modify each file.
3.  Start with the services (`artistService.ts`, `septemberRewardsService.ts`).
4.  Then, correct the API route (`active.ts`).
5.  Finally, fix the components (`September*` files).
6.  After each major change, run `check_for_errors` to ensure no new issues have been introduced.

