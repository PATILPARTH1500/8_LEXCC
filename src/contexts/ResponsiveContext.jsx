import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MOBILE_QUERY = '(max-width: 1024px)';

const ResponsiveContext = createContext({ isMobile: false, responsiveReady: false });

const getViewportWidth = () => {
  if (typeof window === 'undefined') return 1024;
  
  const widths = [
    window.visualViewport?.width,
    document.documentElement?.clientWidth,
    window.innerWidth
  ].filter(w => typeof w === 'number' && w > 0);

  if (widths.length > 0) {
    return Math.min(...widths);
  }
  
  return window.innerWidth || 1024;
};

const checkIsMobile = () => {
  if (typeof window === 'undefined') return false;
  const width = getViewportWidth();
  const matchMedia = window.matchMedia(MOBILE_QUERY).matches;
  
  return width <= 1024 || matchMedia;
};

export const ResponsiveProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [responsiveReady, setResponsiveReady] = useState(false);

  useEffect(() => {
    let timeoutId;
    
    const updateResponsiveState = () => {
      setIsMobile(checkIsMobile());
      setResponsiveReady(true);
    };

    updateResponsiveState();

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateResponsiveState, 50);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateResponsiveState();
      }
    };

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);
    window.addEventListener('pageshow', updateResponsiveState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debouncedUpdate);
      window.visualViewport.addEventListener('scroll', debouncedUpdate);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateResponsiveState);
    } else {
      mediaQuery.addListener(updateResponsiveState);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      window.removeEventListener('pageshow', updateResponsiveState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdate);
        window.visualViewport.removeEventListener('scroll', debouncedUpdate);
      }
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateResponsiveState);
      } else {
        mediaQuery.removeListener(updateResponsiveState);
      }
    };
  }, []);

  const value = useMemo(() => ({ isMobile, responsiveReady }), [isMobile, responsiveReady]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => useContext(ResponsiveContext);
