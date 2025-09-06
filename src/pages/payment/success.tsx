
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Head from 'next/head';

export default function PaymentSuccessPage() {
  return (
    <>
        <Head>
            <title>Payment Successful - OTWChart</title>
        </Head>
        <main className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Thank you for your purchase! Your TicketCube has been upgraded. You'll be able to see the new features on your profile page.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        A confirmation has been sent to your email. Your secure cube is waiting for you!
                    </p>
                    <Link href="/my-cubes" passHref>
                        <Button className="w-full">
                            Go to My Cubes
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </main>
    </>
  );
}