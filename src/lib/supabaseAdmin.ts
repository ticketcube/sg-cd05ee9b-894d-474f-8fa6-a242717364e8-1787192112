import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { NextApiRequest } from 'next';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to verify user ownership
export const verifyUserOwnership = async (
  req: NextApiRequest,
  resourceUserId: string
): Promise<boolean> => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized.');
    return false;
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return false;

  // 1. Is the user the owner of the resource?
  if (user.id === resourceUserId) return true;

  // 2. Is the user an admin?
  const { data: adminProfile } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (adminProfile) return true;

  // This check is redundant if using RLS properly but serves as a failsafe
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', resourceUserId) // Corrected from 'id' to 'user_id'
    .single();

  return profile?.user_id === user.id;
};

// Helper to verify admin access
export async function verifyAdminAccess(userEmail: string): Promise<boolean> {
  const { data: admin } = await supabaseAdmin
    .from('admin_users') 
    .select('email')
    .eq('email', userEmail)
    .single();
    
  return !!admin;
}

// Helper to get user profile by auth ID
export async function getUserProfileByAuthId(authId: string) {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_id', authId)
    .single();
    
  return profile;
}
