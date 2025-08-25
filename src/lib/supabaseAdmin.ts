
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
export async function verifyUserOwnership(authId: string, resourceUserId: string | number): Promise<boolean> {
  if (typeof resourceUserId === 'string') {
    return authId === resourceUserId;
  }
  
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('auth_id')
    .eq('id', resourceUserId)
    .single();
    
  return profile?.auth_id === authId;
}

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
    .eq('auth_id', authId)
    .single();
    
  return profile;
}
