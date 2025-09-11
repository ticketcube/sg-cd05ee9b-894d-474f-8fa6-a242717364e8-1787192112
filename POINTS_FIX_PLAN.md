# Points System Error - Fix Plan

## Issue

The `ArtistInteractionModal.tsx` component is calling the `videoWatchService.recordVideoWatch` function with the wrong argument structure.

- **Problem:** The function is called with a single object: `recordVideoWatch({ artistId, listId })`.
- **Expected:** The function expects two separate arguments: `recordVideoWatch(artistId, listId)`.

This causes the backend API to receive `undefined` for `artistId` and `listId`, resulting in a "Missing required parameters" error.

## Solution

Modify the function call in `src/components/september/ArtistInteractionModal.tsx` to pass the arguments correctly.

**File to Edit:** `src/components/september/ArtistInteractionModal.tsx`

**Change:**

```typescript
// FROM
const result = await videoWatchService.recordVideoWatch({
    artistId: artist.id,
    listId: listId,
});

// TO
const result = await videoWatchService.recordVideoWatch(artist.id, listId);
```

This ensures the `artistId` and `listId` are passed as separate arguments, matching the service's function signature and fixing the error.
