'use client';

import { useEffect } from 'react';

const LEGACY_AUTH_STORAGE_KEY = 'kichulbot-auth';

export function LegacyAuthStorageCleaner() {
  useEffect(() => {
    window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  }, []);

  return null;
}
