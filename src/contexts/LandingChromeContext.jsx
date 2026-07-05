import { createContext, useContext, useMemo, useState } from 'react';
import { getBaselineUnlocked } from '@/lib/baselineStorage';

const LandingChromeContext = createContext(null);

export function LandingChromeProvider({ children }) {
  const [baselineLocked, setBaselineLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !getBaselineUnlocked();
  });

  const value = useMemo(
    () => ({ baselineLocked, setBaselineLocked }),
    [baselineLocked],
  );

  return (
    <LandingChromeContext.Provider value={value}>
      {children}
    </LandingChromeContext.Provider>
  );
}

export function useLandingChrome() {
  return useContext(LandingChromeContext);
}
