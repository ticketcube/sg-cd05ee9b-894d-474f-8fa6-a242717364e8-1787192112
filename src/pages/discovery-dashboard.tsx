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

// Hook & Context Imports
import { useUserProfile } from '@/contexts/UserProfileContext';
import { dashboardStatsService, DashboardStats } from '@/services/dashboardStatsService';

const DiscoveryDashboard = () => {
    const { profile, loading: userLoading, user, isAuthenticated, sessionLoading } = useUserProfile();
    const [activeTab, setActiveTab] = useState('discover');
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalPoints: 0,
        artistsRated: 0,
        weeksActive: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    
    // Mobile optimization: Use refs to prevent excessive re-renders
    const isInitialLoad = useRef(true);
    const statsLoadedFor = useRef<string | null>(null);
    const abortController = useRef<AbortController | null>(null);

    // FIXED: Simplified and mobile-optimized useEffect
    useEffect(() => {
        // Cleanup previous request on unmount or user change
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        // Only fetch stats when we have a stable authenticated user
        // and we haven't already loaded stats for this user
        if (!user?.id || userLoading || sessionLoading) {
            return;
        }

        // Prevent duplicate requests for the same user
        if (statsLoadedFor.current === user.id) {
            return;
        }

        // Mobile optimization: Add slight delay on initial load to prevent conflicts
        const delay = isInitialLoad.current ? 100 : 0;
        
        const timeoutId = setTimeout(() => {
            fetchStatsWithCleanup(user.id);
        }, delay);

        isInitialLoad.current = false;

        return () => {
            clearTimeout(timeoutId);
        };
    }, [user?.id, userLoading, sessionLoading]);

    const fetchStatsWithCleanup = async (userId: string) => {
        // Abort any previous request
        if (abortController.current) {
            abortController.current.abort();
        }

        // Create new abort controller
        abortController.current = new AbortController();

        try {
            setStatsLoading(true);
            setStatsError(null);
            
            console.log('[DiscoveryDashboard] Fetching stats for user:', userId);
            
            const stats = await dashboardStatsService.getUserStats(userId);
            
            // Only update if request wasn't aborted
            if (!abortController.current?.signal.aborted) {
                setDashboardStats(stats);
                statsLoadedFor.current = userId;
                console.log('[DiscoveryDashboard] Stats loaded successfully:', stats);
            }
            
        } catch (error) {
            // Only handle error if request wasn't aborted
            if (!abortController.current?.signal.aborted) {
                console.error('[DiscoveryDashboard] Error fetching dashboard stats:', error);
                setStatsError('Failed to load dashboard statistics');
                
                // Fallback to profile data
                setDashboardStats({
                    totalPoints: profile?.total_points || 0,
                    artistsRated: 0,
                    weeksActive: 0
                });
            }
        } finally {
            // Only update loading state if request wasn't aborted
            if (!abortController.current?.signal.aborted) {
                setStatsLoading(false);
            }
        }
    };

    // Show loading during session check
    if (sessionLoading) {
        return <DashboardLoading />;
    }

    // Show loading during user profile loading
    if (userLoading) {
        return <DashboardLoading />;
    }

    // Show auth block if not authenticated
    if (!isAuthenticated || !profile || !user) {
        return <DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} />;
    }

   

    return (
        <div className="min-h-screen bg-white">
            {/* Error Banner */}
            {statsError && (
                <div className="bg-red-50 border border-red-200 p-3">
                    <div className="max-w-6xl mx-auto flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <p className="text-sm text-red-600">{statsError}</p>
                        <button 
                            onClick={() => {
                                setStatsError(null);
                                if (user?.id) {
                                    statsLoadedFor.current = null; // Reset to allow refetch
                                    fetchStatsWithCleanup(user.id);
                                }
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
                total_points={statsLoading ? (profile?.total_points || 0) : dashboardStats.totalPoints}
                artistsRated={dashboardStats.artistsRated}
                weeksActive={dashboardStats.weeksActive}
            />

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 pb-12">
                {renderContent()}
            </div>
        </div>
    );
};

export default DiscoveryDashboard;