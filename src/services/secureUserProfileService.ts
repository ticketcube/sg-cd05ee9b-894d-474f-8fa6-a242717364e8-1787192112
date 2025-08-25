
import { supabase } from '@/integrations/supabase/client';
import type { EngagementType } from './userProfileService';

export const secureUserProfileService = {
  async recordEngagement(
    userId: number,
    engagementType: EngagementType,
    pointsEarned: number,
    weekIdentifier: string,
    artistUuid?: string,
    metadata?: Record<string, any>
  ) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/user/engagement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        userId,
        engagementType,
        pointsEarned,
        weekIdentifier,
        artistUuid,
        metadata
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record engagement');
    }

    return response.json();
  },

  async submitVotes(userId: number, votes: any[], weekIdentifier: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/voting/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId, votes, weekIdentifier })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit votes');
    }

    return response.json();
  },

  async getAdminStats() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/admin/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get admin stats');
    }

    return response.json();
  }
};

export default secureUserProfileService;
