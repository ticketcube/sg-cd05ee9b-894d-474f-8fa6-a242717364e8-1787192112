import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeptemberReward } from "./SeptemberReward";
import Link from "next/link";

export default function MoreRewardsTab() {
    return (
        <div className="space-y-6">
            {/* September Discovery Reward */}
            <SeptemberReward />
            
            {/* Additional Rewards Section */}
            <Card className="border-neutral-200/60 shadow-lg shadow-neutral-900/5">
                <CardHeader>
                    <CardTitle className="text-neutral-800">Discover More Ways to Earn</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-neutral-600 leading-relaxed">
                        You've unlocked the basics. Explore other charts and features to earn more points and discover new artists.
                    </p>
                    <Link href="/genres">
                        <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                            Explore Genre Charts
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}