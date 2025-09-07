// src/hooks/usePointsOnboarding.ts
import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'hasSeenPointsOnboarding';

/**
 * A hook to manage the display of a one-time onboarding message.
 * It checks localStorage to see if the user has already seen the message.
 *
 * @returns An object containing:
 *  - showOnboarding: A boolean indicating whether to show the modal.
 *  - dismiss: A function to call when the user dismisses the modal.
 */
export function usePointsOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        // We only want to run this check on the client-side, after hydration.
        // Checking localStorage on the server would cause an error.
        const hasSeen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!hasSeen) {
            setShowOnboarding(true);
        }
    }, []); // Empty dependency array ensures this runs only once on mount.

    const dismiss = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        setShowOnboarding(false);
    };

    return { showOnboarding, dismiss };
}