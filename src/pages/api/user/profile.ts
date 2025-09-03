
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = session.user.id;

  try {
    switch (req.method) {
      case 'GET':
        // ✅ NEW: Handle GET requests with optional user_id parameter
        const requestedUserId = req.query.user_id as string;
        const targetUserId = requestedUserId || userId; // Use query param or current user
        
        console.log(`[API] Getting profile for user_id: ${targetUserId}`);
        
        const { data: profile, error: getError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (getError) {
          console.error('[API] Error fetching profile:', getError);
          return res.status(500).json({ error: 'Failed to fetch profile' });
        }

        if (!profile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        return res.status(200).json(profile);

      case 'POST':
        // ✅ EXISTING: Create profile functionality
        const { username, email, city } = req.body;

        if (!username || !email) {
          return res.status(400).json({ error: 'Username and email are required' });
        }

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            username: username.trim(),
            email: email.trim(),
            raw_city_input: city?.trim() || null,
          })
          .select()
          .single();

        if (createError) {
          console.error('[API] Error creating profile:', createError);
          return res.status(500).json({ error: 'Failed to create profile' });
        }

        return res.status(201).json({ profile: newProfile });

      case 'PUT':
        // ✅ EXISTING: Update profile functionality
        const { username: updateUsername, email: updateEmail, city: updateCity } = req.body;
        
        const updateData: any = {};
        if (updateUsername !== undefined) updateData.username = updateUsername.trim();
        if (updateEmail !== undefined) updateData.email = updateEmail.trim();
        if (updateCity !== undefined) updateData.raw_city_input = updateCity?.trim() || null;

        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('[API] Error updating profile:', updateError);
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        return res.status(200).json({ profile: updatedProfile });

      case 'DELETE':
        // ✅ EXISTING: Delete profile functionality
        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('[API] Error deleting profile:', deleteError);
          return res.status(500).json({ error: 'Failed to delete profile' });
        }

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}