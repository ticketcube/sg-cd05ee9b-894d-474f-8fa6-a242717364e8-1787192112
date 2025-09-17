# Artist Lookup Feature Summary

This document provides a summary of the existing artist lookup functionality, based on a review of the current codebase.

## 1. Purpose

The primary component for this feature is `src/components/ArtistProfileLookup.tsx`. It serves as a staff-only internal tool to quickly search for and view artist profiles stored in the Supabase database.

## 2. Core Functionality

- **Search**: Provides a search-as-you-type input field with a 400ms debounce to look up artists by name.
- **Data Fetching**: Queries the `artists` table directly using the Supabase client. It searches for `artist_name` using a case-insensitive `ilike` match.
- **Display**:
    - If an artist is found, it displays their name, home city, and genre.
    - If the artist has a video link (`artist_videolink`), a "Watch Video" button is shown.
- **Video Modal**: Clicking the "Watch Video" button opens a modal with an embedded iframe to play the artist's video.

## 3. Key Files

- **Implementation**: `src/components/ArtistProfileLookup.tsx`
- **Related Planning**: `ARTIST_REFACTOR_PLAN.md` (This document provides context on the database schema and property names like `artist_name` which are used in the lookup component).
- **Associated Service**: `src/services/artistService.ts` (Contains related methods for fetching artist data).

## 4. Improvement Opportunity &amp; Recommendation

**Observation**: The `ArtistProfileLookup.tsx` component currently bypasses the centralized `artistService.ts` and makes a direct call to Supabase.

**Recommendation**: To improve code organization, separation of concerns, and maintainability, the data-fetching logic should be moved from the component into `artistService.ts`.

A new method could be added to the `ArtistService` class:

```typescript
// In src/services/artistService.ts

async searchArtistByName(name: string): Promise&lt;Artist | null&gt; {
  if (!name.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("artists")
    .select("artist_name, artist_home, artist_genre, artist_videolink")
    .ilike("artist_name", `%${name}%`)
    .limit(1)
    .single(); // Use .single() to get one object or null

  if (error &amp;&amp; error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error("Error searching for artist:", error);
    throw error;
  }

  return data;
}
```

The `ArtistProfileLookup.tsx` component could then be refactored to call this new service method, simplifying the component's code.

## 5. Next Steps

- Review this summary.
- If you approve of the recommendation, I can proceed with refactoring the component in **Standard Mode**.
