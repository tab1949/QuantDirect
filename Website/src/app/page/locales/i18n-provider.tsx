'use client';

import { useEffect } from 'react';
import './client-i18n'; // Initialize client-side i18n
import i18n from './client-i18n';
import { getDetectedLanguage, supportedLang } from './client-i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for saved language in localStorage first
    const savedLang = localStorage.getItem('preferredLanguage');
    let targetLang = 'en-US';
    
    if (savedLang && supportedLang.includes(savedLang)) {
      targetLang = savedLang;
    } else {
      targetLang = getDetectedLanguage();
    }
    
    if (targetLang !== i18n.language) {
      i18n.changeLanguage(targetLang);
      localStorage.setItem('preferredLanguage', targetLang);
    }
  }, []);

  return <>{children}</>;
}
