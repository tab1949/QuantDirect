'use client';

import { useEffect } from 'react';
import './client-i18n'; // Initialize client-side i18n

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Any additional client-side initialization can go here
  }, []);

  return <>{children}</>;
}
