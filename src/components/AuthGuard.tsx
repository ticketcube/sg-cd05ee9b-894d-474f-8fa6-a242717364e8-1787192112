import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { user, loading } = useUserProfile();
    const router = useRouter();

    useEffect(() => {
        // Don't do anything while loading
        if (loading) {
            return;
        }

        // If loading is finished and there's no user, redirect to home
        if (!user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // While loading, show a loading indicator or null
    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    // If there's a user, render the children
    if (user) {
        return <>{children}</>;
    }

    // If no user and not loading (i.e., redirect is imminent), return null
    return null;
};

export default AuthGuard;