'use client';

import { useEffect, useRef } from 'react';
import { useCarportStore } from '@/store/carportStore';
import { parseConfigFromUrl, clearConfigFromUrl } from '@/utils/configSharing';

/**
 * Component that handles loading config from URL on mount.
 * URL config takes priority over local storage.
 */
export default function ConfigLoader() {
  const setConfig = useCarportStore((state) => state.setConfig);
  const isHydrated = useCarportStore((state) => state.isHydrated);
  const hasLoadedFromUrl = useRef(false);

  useEffect(() => {
    // Wait for hydration to complete before checking URL
    if (!isHydrated) return;
    
    // Only try to load from URL once
    if (hasLoadedFromUrl.current) return;
    hasLoadedFromUrl.current = true;

    const urlConfig = parseConfigFromUrl();
    if (urlConfig) {
      setConfig(urlConfig);
      // Clear the config param from URL for cleaner appearance
      clearConfigFromUrl();
    }
  }, [isHydrated, setConfig]);

  return null; // This component renders nothing
}
