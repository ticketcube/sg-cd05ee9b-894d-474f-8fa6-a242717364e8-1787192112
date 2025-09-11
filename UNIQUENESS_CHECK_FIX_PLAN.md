
# Plan: Implement Uniqueness Check for User Engagements

**Problem:** The current `/api/user/engagement` API endpoint does not check if a user has already submitted a rating for a specific artist within the same week. This allows users to submit multiple ratings for the same artist and earn points repeatedly, which undermines the points system.

**Solution:** Modify the API endpoint to perform a "look before you leap" check. Before inserting a new engagement record, it will query the `user_engagements` table to see if a record already exists for the same `user_id`, `artist_uuid`, and `week_identifier`.

## Implementation Steps

1.  **File to Modify:** `src/pages/api/user/engagement.ts`
2.  **Logic to Add:**
    *   Before the `insert` operation, add a `SELECT` query to check for an existing engagement matching `user.id`, `artist_uuid`, and `week_identifier`.
    *   If a record is found, immediately return a `200` status with `{ success: false, error: 'You have already completed this action for this artist this week.' }`.
    *   If no record is found, proceed with the existing `insert` and point update logic.
    *   For improved security and consistency, the `points_earned` should be determined on the backend based on the `engagementType`, not trusted from the client.

## Proposed New Code for `src/pages/api/user/engagement.ts`

This new code implements the uniqueness check and centralizes point logic on the backend.

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';

// Central place for engagement points configuration
const ENGAGEMENT_POINTS: { [key: string]: number } = {
    quadrant: 10,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { authorization } = req.headers;
    const token = authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'Access denied: Invalid or expired token' });
    }
    
    // Use more descriptive names from the frontend call
    const { engagementType, artistUuid, weekIdentifier, x_quadrant, y_quadrant, additionalData } = req.body;

    if (!engagementType || !artistUuid || !weekIdentifier) {
        return res.status(400).json({ error: 'Missing required engagement data.' });
    }

    try {
        // 1. UNIQUENESS CHECK
        const { data: existingEngagement, error: checkError } = await supabaseAdmin
            .from('user_engagements')
            .select('id')
            .eq('user_id', user.id)
            .eq('artist_uuid', artistUuid)
            .eq('week_identifier', weekIdentifier)
            .eq('engagement_type', engagementType)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking for existing engagement:', checkError);
            throw new Error(`Failed to check for engagement: ${checkError.message}`);
        }

        if (existingEngagement) {
            return res.status(200).json({ success: false, error: 'You have already completed this action for this artist this week.' });
        }

        // 2. Determine points on the backend
        const pointsEarned = ENGAGEMENT_POINTS[engagementType] || 0;

        // 3. Insert new engagement record
        const { error: insertError } = await supabaseAdmin.from('user_engagements').insert([
            {
                user_id: user.id,
                engagement_type: engagementType,
                points_earned: pointsEarned,
                artist_uuid: artistUuid,
                week_identifier: weekIdentifier,
                metadata: {
                    x_quadrant,
                    y_quadrant,
                    ...additionalData
                }
            },
        ]);

        if (insertError) {
            console.error('Error inserting user engagement:', insertError);
            throw new Error(`Failed to insert engagement: ${insertError.message}`);
        }
        
        // 4. Update user's total points if points were earned
        if (pointsEarned > 0) {
            const { error: rpcError } = await supabaseAdmin.rpc('increment_user_points', {
                user_id_in: user.id,
                points_in: pointsEarned
            });

            if (rpcError) {
                console.error(`Failed to update total points for user ${user.id} via RPC: ${rpcError.message}`);
            }
        }
        
        res.status(200).json({ success: true, pointsEarned, message: "Engagement recorded successfully." });

    } catch (error: any) {
        console.error('Engagement API critical error:', error.message);
        res.status(500).json({ error: error.message, success: false });
    }
}

-- We also need to create a postgres function for atomically updating points to prevent race conditions.
-- This can be run in the Supabase SQL Editor.
/*
create or replace function increment_user_points (user_id_in uuid, points_in int)
returns void as $$
  update user_profiles
  set total_points = total_points + points_in,
      updated_at = now()
  where user_id = user_id_in;
$$ language sql volatile;
*/

```
