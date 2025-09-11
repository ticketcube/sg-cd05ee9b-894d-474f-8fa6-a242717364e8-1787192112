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
         
        </div>
    );
}