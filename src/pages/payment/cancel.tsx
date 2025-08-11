
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import Head from 'next/head';

export default function PaymentCancelPage() {
  return (
    <>
        <Head>
            <title>Payment Canceled - OTWChart</title>
        </Head>
        <Navbar />
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Payment Canceled</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Your payment process was canceled. You have not been charged.
                    </p>
                    <CardDescription>
                        If you'd like to try again, you can return to the cube creation page and select a plan.
                    </CardDescription>
                    <div className="flex gap-4 pt-2">
                         <Link href="/ticketcube" passHref className="flex-1">
                            <Button variant="outline" className="w-full">
                                Back to Cube Creator
                            </Button>
                        </Link>
                        <Link href="/" passHref className="flex-1">
                            <Button className="w-full">
                                Go to Homepage
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </main>
    </>
  );
}
