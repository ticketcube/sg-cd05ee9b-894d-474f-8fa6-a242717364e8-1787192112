import { useState, useEffect } from 'react';

// This is a standard breakpoint for mobile devices (up to tablets).
const MOBILE_BREAKPOINT = '(max-width: 768px)';

/**
 * A custom React hook that returns `true` if the viewport is mobile-sized.
 * It's safe for server-side rendering.
 */
export function useMobile(): boolean {
  // Default to `false` on the server to avoid hydration mismatches.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This code only runs on the client (in the browser).
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

    // Function to update state based on the media query.
    const handleResize = () => {
      setIsMobile(mediaQuery.matches);
    };

    // Set the initial value on mount.
    handleResize();

    // Listen for changes in the viewport size.
    mediaQuery.addEventListener('change', handleResize);

    // Clean up the listener when the component unmounts.
    return () => {
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, []); // The empty array ensures this effect runs only once.

  return isMobile;
}
