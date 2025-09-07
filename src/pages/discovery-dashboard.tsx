
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useUserProfile } from "@/contexts/UserProfileContext";
import userProfileService from "@/services/userProfileService";
import type { UserEngagementHistory } from "@/services/userProfileService";

import StaffPortalTab from "@/components/StaffPortalTab";
import { Button } from "@/components/ui/button";

// New Dashboard Components
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardAuthBlock from "@/components/dashboard/DashboardAuthBlock";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TabNavigation from "@/components/dashboard/TabNavigation";
import DiscoverMoreTab from "@/components/dashboard/DiscoverMoreTab";
import MoreRewardsTab from "@/components/dashboard/MoreRewardsTab";

// ---------------- MAIN DASHBOARD COMPONENT ----------------
export default function DiscoveryDashboard() {
    const router = useRouter();
    const { user, profile, role, loading: profileLoading } = useUserProfile();

    const [userHistory, setUserHistory] = useState&lt;UserEngagementHistory | null&gt;(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState&lt;string | null&gt;(null);
    const [activeTab, setActiveTab] = useState&lt;"discover" | "rewards" | "staff"&gt;("discover");
    const [showAuthDialog, setShowAuthDialog] = useState(false);

    useEffect(() => {
        const { tab } = router.query;
        if (tab === 'rewards' || (tab === 'staff' && role === 'otwstaff')) {
            setActiveTab(tab as "rewards" | "staff");
        } else {
            setActiveTab('discover');
        }
    }, [router.query, role]);

    useEffect(() => {
        if (user &amp;&amp; profile) {
            const fetchUserHistory = async () => {
                setHistoryLoading(true);
                setHistoryError(null);
                try {
                    const history = await userProfileService.getUserEngagementHistory(profile.user_id);
                    setUserHistory(history);
                } catch (err: any) {
                    console.error("Error fetching user engagement history:", err);
                    setHistoryError(err.message || "Failed to load your activity history.");
                } finally {
                    setHistoryLoading(false);
                }
            };

            fetchUserHistory();
        } else if (!profileLoading) {
            // Not logged in, or no profile yet
            setHistoryLoading(false);
        }
    }, [user, profile, profileLoading]);

    if (profileLoading) {
        return &lt;DashboardLoading /&gt;;
    }

    if (!user) {
        return &lt;DashboardAuthBlock showAuthDialog={showAuthDialog} setShowAuthDialog={setShowAuthDialog} /&gt;;
    }

    if (historyError) {
        return (
            &lt;div className="min-h-screen bg-black text-white flex items-center justify-center"&gt;
                &lt;div className="text-center max-w-md mx-auto px-4"&gt;
                    &lt;h1 className="text-xl md:text-2xl font-bold mb-4"&gt;Dashboard Error&lt;/h1&gt;
                    &lt;p className="text-red-400 mb-6"&gt;{historyError}&lt;/p&gt;
                    &lt;Button onClick={() =&gt; window.location.reload()}&gt;Refresh Page&lt;/Button&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        );
    }

    const { weekly_summaries = [], total_points = 0 } = userHistory || {};
    const totalVotes = userHistory ? weekly_summaries.reduce((sum, week) =&gt; sum + week.votes_submitted, 0) : 0;
    const totalVideos = userHistory ? weekly_summaries.reduce((sum, week) =&gt; sum + week.video_views, 0) : 0;
    const weeksActive = userHistory ? weekly_summaries.length : 0;

    return (
        &lt;div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"&gt;
            &lt;DashboardHeader
                profile={profile}
                historyLoading={historyLoading}
                total_points={total_points}
                totalVotes={totalVotes}
                totalVideos={totalVideos}
                weeksActive={weeksActive}
            /&gt;

            &lt;div className="max-w-4xl mx-auto px-3 md:px-4 pb-8 md:pb-12"&gt;
                &lt;TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    role={role}
                /&gt;
                
                {activeTab === "discover" &amp;&amp; &lt;DiscoverMoreTab /&gt;}
                {activeTab === "rewards" &amp;&amp; &lt;MoreRewardsTab totalPoints={total_points} weeksActive={weeksActive} totalVideos={totalVideos} /&gt;}
                {activeTab === "staff" &amp;&amp; role === 'otwstaff' &amp;&amp; &lt;StaffPortalTab /&gt;}
            &lt;/div&gt;
        &lt;/div&gt;
    );
}
