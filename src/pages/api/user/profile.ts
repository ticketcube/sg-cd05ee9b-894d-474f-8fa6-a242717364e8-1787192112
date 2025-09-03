
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
        // Handle GET requests with optional user_id parameter
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
          return res.status(404).json({ 
            error: 'Profile not found',
            details: 'Profile should have been created automatically. Please contact support.'
          });
        }

        return res.status(200).json(profile);

      case 'POST':
        // ❌ REMOVED: Profile creation is now handled by database trigger
        // This endpoint now only handles profile updates
        return res.status(405).json({ 
          error: 'Profile creation is handled automatically. Use PUT to update profile data.',
          details: 'Profiles are created automatically when users sign up. Use PUT method to update profile information.'
        });

      case 'PUT':
        // Update profile functionality - enhanced to work with trigger-created profiles
        const { username: updateUsername, email: updateEmail, city: updateCity } = req.body;
        
        // First, check if profile exists (it should, thanks to the database trigger)
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (checkError) {
          if (checkError.code === 'PGRST116') {
            console.error('[API] Profile not found for user_id:', userId);
            return res.status(404).json({ 
              error: 'Profile not found', 
              details: 'Profile should have been created automatically. Please contact support.' 
            });
          }
          console.error('[API] Error checking existing profile:', checkError);
          return res.status(500).json({ error: 'Database error during profile check' });
        }

        if (!existingProfile) {
          console.error('[API] No profile found for user_id:', userId);
          return res.status(404).json({ 
            error: 'Profile not found', 
            details: 'Profile should have been created automatically. Please contact support.' 
          });
        }

        // Handle city lookup if provided
        let cityId: number | null = existingProfile.city_id;
        if (updateCity && updateCity.trim()) {
          const { data: cityData } = await supabase
            .from('city_latlong')
            .select('id')
            .eq('normalized_name', updateCity.trim().toLowerCase())
            .single();
          
          cityId = cityData?.id || null;
        }

        // Prepare update data - only update fields that are provided
        const updateData: any = {};
        if (updateUsername !== undefined && updateUsername.trim()) {
          updateData.username = updateUsername.trim();
        }
        if (updateEmail !== undefined && updateEmail.trim()) {
          updateData.email = updateEmail.trim();
        }
        if (updateCity !== undefined) {
          updateData.city_id = cityId;
          updateData.raw_city_input = updateCity?.trim() || null;
        }

        // If no update data provided, just return the existing profile
        if (Object.keys(updateData).length === 0) {
          console.log('[API] No update data provided, returning existing profile');
          return res.status(200).json({ 
            profile: existingProfile,
            message: 'No updates needed' 
          });
        }

        console.log('[API] Updating profile with data:', updateData);

        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('[API] Error updating profile:', updateError);
          return res.status(500).json({ 
            error: 'Failed to update profile',
            details: updateError.message
          });
        }

        if (!updatedProfile) {
          console.error('[API] No profile returned after update');
          return res.status(500).json({ error: 'Profile update failed - no data returned' });
        }

        return res.status(200).json({ 
          profile: updatedProfile,
          message: 'Profile updated successfully'
        });

      case 'DELETE':
        // Delete profile functionality - keeping as is
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
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
