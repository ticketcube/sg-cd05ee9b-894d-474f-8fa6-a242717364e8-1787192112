import { supabase } from '@/integrations/supabase/client';
import type { EngagementType } from './userProfileService';

export const secureUserProfileService = {
    /**
     * Get user profile using the secure API endpoint
     * This uses the server-side admin client for enhanced security
     */
    async getUserProfile(userId: string) {
        try {
            console.log('[SecureUserProfileService] Getting profile for user_id:', userId);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Authentication required to fetch secure profile.");
            }

            const response = await fetch(`/api/user/secure-profile?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            const { profile } = await response.json();
            return profile;
        } catch (error) {
            console.error('[SecureUserProfileService] Error getting user profile:', error);
            throw error;
        }
    },

    /**
     * Update user profile using the secure API endpoint
     * Note: Profile creation is now handled automatically by database trigger
     */
    async updateUserProfile(userId: string, profileData: {
        username?: string;
        email?: string;
        city?: string;
        role?: string;
    }) {
        try {
            console.log('[SecureUserProfileService] Updating profile for user_id:', userId, profileData);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Authentication required to update profile.");
            }

            const response = await fetch('/api/user/secure-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    ...profileData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }

            const { profile } = await response.json();
            return profile;
        } catch (error) {
            console.error('[SecureUserProfileService] Error updating profile:', error);
            throw error;
        }
    },

    /**
     * Record user engagement with authentication
     */
    async recordEngagement(
        userId: string, // ✅ FIXED: Changed from number to string to match user_id UUID type
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
                userId, // ✅ FIXED: Now using string userId instead of number
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

    /**
     * Submit votes with authentication
     */
    async submitVotes(userId: string, votes: any[], weekIdentifier: string) { // ✅ FIXED: Changed from number to string
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

    /**
     * Get admin statistics (requires otwstaff role)
     */
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
