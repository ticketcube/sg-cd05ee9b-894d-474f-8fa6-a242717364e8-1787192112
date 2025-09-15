import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Component Imports
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import DashboardAuthBlock from '@/components/dashboard/DashboardAuthBlock';
import { SeptemberReward } from '@/components/dashboard/SeptemberReward';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Music, Award, TrendingUp, AlertCircle } from 'lucide-react';

// Hook & Service Imports
import { useUserProfile } from '@/contexts/UserProfileContext';
import { getUserEngagementHistory, UserEngagementHistory } from '@/services/userProfileService';

const DiscoveryDashboard = () => {
    const { profile, loading: userLoading, user, isAuthenticated, sessionLoading } = useUserProfile();
    const [activeTab, setActiveTab] = useState('discover');
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    // Engagement history state
    const [history, setHistory] = useState < UserEngagementHistory | null > (null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState < string | null > (null);

    // Mobile optimization: use refs
    const abortController = useRef < AbortController | null > (null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    // Fetch engagement history when user.id becomes available
    useEffect(() => {
        if (!user?.id) return;
        fetchHistory(user.id);
    }, [user?.id]);

    const fetchHistory = async (userId: string) => {
        // Abort any previous request
        if (abortController.current) {
            abortController.current.abort();
        }

        abortController.current = new AbortController();
        const { signal } = abortController.current;

        try {
            setStatsLoading(true);
            setStatsError(null);

            console.log('[DiscoveryDashboard] Fetching engagement history for user:', userId);
            const userHistory = await getUserEngagementHistory(userId);

            if (!signal.aborted) {
                setHistory(userHistory);
                console.log('[DiscoveryDashboard] Engagement history loaded. Weeks:', userHistory?.weekly_summaries?.length || 0);
            }
        } catch (err) {
            if (!signal.aborted) {
                console.error('[DiscoveryDashboard] Error fetching engagement history:', err);
                setStatsError('Failed to load engagement history');
                setHistory(null);
            }
        } finally {
            if (!signal.aborted) {
                setStatsLoading(false);
            }
        }
    };

    // Loading & auth handling
    if (sessionLoading || userLoading) return <DashboardLoading />;
    if (!isAuthenticated || !profile || !user)
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;

    return (
        <div className="min-h-screen bg-white">
            {statsError && (
                <div className="bg-red-50 border border-red-200 p-3">
                    <div className="max-w-6xl mx-auto flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-sm text-red-600">{statsError}</p>
                        <button
                            onClick={() => {
                                setStatsError(null);
                                if (user?.id) fetchHistory(user.id);
                            }}
                            className="ml-auto text-xs text-red-700 underline hover:no-underline"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <DashboardHeader
                profile={profile}
                historyLoading={statsLoading}
                total_points={history?.total_points || 0}
                artistsDiscovered={history?.artistsDiscovered || 0}
                weeksActive={history?.weekly_summaries?.length || 0} // safe optional chaining
            />

            <div className="max-w-6xl mx-auto px-2 py-4">
                <SeptemberReward />
            </div>
        </div>
    );
};

export default DiscoveryDashboard;