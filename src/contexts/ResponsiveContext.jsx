import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MOBILE_QUERY = '(max-width: 1024px)';

const ResponsiveContext = createContext({ isMobile: false });

const readMobileMatch = () => (
  typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
);

export const ResponsiveProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(readMobileMatch);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const value = useMemo(() => ({ isMobile }), [isMobile]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => useContext(ResponsiveContext);
