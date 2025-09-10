# Points System Uniqueness and Frequency Plan

This document outlines the required changes to enforce the "once per artist, per list" rule for earning points, for both video views and ratings.

### Current Status
-   **Quadrant Rating:** The code flow correctly passes the `weekly_list_id` to the backend, and the API at `/api/user/engagement` properly checks for existing engagements to prevent duplicate points. This is working as intended.
-   **Video View:** The code flow **does not** pass the `weekly_list_id` when a user watches a video. The API at `/api/user/video-points` consequently cannot enforce the uniqueness rule correctly. This is the primary issue to resolve.

### Implementation Steps

The goal is to make the `video_view` flow mirror the correct implementation of the `quadrant` rating flow.

---

#### Step 1: Update `ArtistInteractionModal` to receive `listId`

**File:** `src/components/september/ArtistInteractionModal.tsx`

1.  **Modify the Props Interface:** Add `listId` to `ArtistInteractionModalProps`.
    ```typescript
    interface ArtistInteractionModalProps {
        // ... existing props
        listId: number | null;
        onRatingComplete: (artistId: number, data: { x: number; y: number }) => void;
    }
    ```

2.  **Update the Component Signature:**
    ```typescript
    export function ArtistInteractionModal({
        // ... existing props
        listId,
        onRatingComplete,
    }: ArtistInteractionModalProps) {
        // ...
    }
    ```

3.  **Update the `handleVideoComplete` function:** Pass the `listId` to the service call.
    ```typescript
    const handleVideoComplete = async () => {
        if (!artist || !artist.id || !listId) return; // Add guard for listId

        console.log(`Video watch complete for artist ${artist.id} on list ${listId}. Recording points...`);
        try {
            // Pass artist.id and listId
            const result = await videoWatchService.recordVideoWatch(artist.id, listId);
            setPointsEarned(result.pointsEarned);
        } catch (error) {
            console.error("Failed to record video watch points:", error);
            setPointsEarned(null);
        } finally {
            setShowRating(true);
        }
    };
    ```

---

#### Step 2: Pass `currentListId` from the Page

**File:** `src/pages/septemberrewards.tsx`

1.  **Update the component usage:** Find the `<ArtistInteractionModal ... />` component and pass the `currentListId` state to the new `listId` prop.
    ```tsx
    <ArtistInteractionModal
        artist={selectedArtist}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRatingComplete={handleRatingComplete}
        listId={currentListId}
    />
    ```

---

#### Step 3: Update `videoWatchService`

**File:** `src/services/videoWatchService.ts`

1.  **Modify `recordVideoWatch` function signature:** It needs to accept `listId`.
    ```typescript
    async recordVideoWatch(artistId: number, listId: number): Promise<{ pointsEarned: number; message: string }> {
      // ...
    }
    ```

2.  **Update the API call:** Include `listId` in the body of the `fetch` request.
    ```typescript
    const response = await fetch('/api/user/video-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, listId }), // Add listId here
    });
    ```

---

#### Step 4: Update the Backend API for Video Points

**File:** `src/pages/api/user/video-points.ts`

This is the most critical change. The entire logic of this file needs to be updated to match the logic in `/api/user/engagement.ts`.

1.  **Get User and Body Params:** Get the `user` from the session and extract `artistId` and `listId` from the request body. Add validation.

2.  **Check for Existing Engagement:** Before awarding points, query the `user_engagements` table to see if a `video_view` engagement already exists for this user, artist, and list.
    ```typescript
    const { data: existingEngagement, error: checkError } = await supabaseAdmin
      .from('user_engagements')
      .select('id')
      .eq('user_id', user.id)
      .eq('artist_id', artistId)
      .eq('weekly_list_id', listId)
      .eq('engagement_type', 'video_view')
      .maybeSingle();
    
    if (checkError) throw checkError;

    if (existingEngagement) {
      return res.status(200).json({ message: 'Video already watched for this list.', pointsEarned: 0 });
    }
    ```
    
3.  **Fetch Points Configuration:** Get the points value for `video_view` from `points_config`.

4.  **Insert New Engagement:** If no existing engagement was found, insert a new record into `user_engagements`. Include `user_id`, `artist_id`, `weekly_list_id`, `engagement_type`, and `points_awarded`.

5.  **Update User's Total Points:** Atomically update the `points` column in the `user_profiles` table for the user. Using an RPC function for this is recommended for safety.

6.  **Return Success:** Return a success message and the number of points earned.

This plan will fully implement the required business logic.
