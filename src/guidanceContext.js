import { createContext, useContext, useEffect } from 'react';

/* Separate from Guidance.jsx so that file can export only components — mixing
 * hooks and components in one module breaks fast refresh (and the lint rule
 * that guards it). */
export const GuidanceCtx = createContext({ tab: null, setTab: () => {} });

/* One line in a study app: useGuidanceTab(activeTab). Safe to call from a topic
 * rendered outside the provider — the default context no-ops. */
export function useGuidanceTab(tab) {
  const { setTab } = useContext(GuidanceCtx);
  useEffect(() => {
    setTab(tab ?? null);
  }, [tab, setTab]);
}

export function useGuidanceState() {
  return useContext(GuidanceCtx);
}
