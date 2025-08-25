
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token using Supabase Admin client
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error('Auth verification failed:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('Authenticated user:', authUser.id, authUser.email);

    if (req.method === 'GET') {
      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found
          return res.status(404).json({ error: 'Profile not found', needsCreation: true });
        }
        console.error('Database error:', profileError);
        return res.status(500).json({ error: 'Database error' });
      }

      return res.status(200).json({ profile });
    }

    if (req.method === 'POST') {
      // Create or update user profile
      const { username, email, city } = req.body;

      if (!username || !email) {
        return res.status(400).json({ error: 'Username and email are required' });
      }

      // First, try to get existing profile
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      let profile;

      if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            username: username.trim(),
            email: email.trim(),
            raw_city_input: city?.trim() || null,
            last_active: new Date().toISOString()
          })
          .eq('auth_id', authUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Profile update error:', updateError);
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        profile = updatedProfile;
        console.log('Profile updated successfully:', profile.id);
      } else {
        // Create new profile
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('user_profiles')
          .insert([{
            auth_id: authUser.id,
            username: username.trim(),
            email: email.trim(),
            raw_city_input: city?.trim() || null,
            total_points: 0,
            last_active: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          return res.status(500).json({ error: 'Failed to create profile' });
        }

        profile = newProfile;
        console.log('Profile created successfully:', profile.id);
      }

      return res.status(200).json({ profile });
    }

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
