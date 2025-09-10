import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function MoreRewardsTab () {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Discover More Ways to Earn</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">You've unlocked the basics. Explore other charts and features to earn more points and discover new artists.</p>
                <Link href="/genres" passHref>
                    <Button>Explore Genre Charts</Button>
                </Link>
            </CardContent>
        </Card>
    );
};

