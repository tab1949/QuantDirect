'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import lang_ZH_CN from './resource/zh-CN.json';
import lang_ZH_HK from './resource/zh-HK.json';
import lang_EN_US from './resource/en-US.json';

export const supportedLang = ['en-US', 'zh-CN', 'zh-HK'];
export const langName = ['English', '简体中文', '繁體中文'];
export enum languages {EN_US, ZH_CN, ZH_HK};

export const resources = {
    'en-US': {
        translation: lang_EN_US,
        explore: lang_EN_US.explore,
        basic: lang_EN_US.basic,
        home: lang_EN_US.home
    },
    'zh-CN': {
        translation: lang_ZH_CN,
        explore: lang_ZH_CN.explore,
        basic: lang_ZH_CN.basic,
        home: lang_ZH_CN.home
    },
    'zh-HK': {
        translation: lang_ZH_HK,
        explore: lang_ZH_HK.explore,
        basic: lang_ZH_HK.basic,
        home: lang_ZH_HK.home
    }
};

function normalizeLangCode(code: string): string {
    if (!code || code === 'undefined' || code === 'null') return 'en-US';
    code = code.toLowerCase().trim().replace(/\s+/g, '');
    if (code === 'en' || code.startsWith('en-') || code === 'english') return 'en-US';
    if (code === 'zh' || code === 'zh-cn' || code === 'zh-hans' || code === 'zh-sg' || code === 'zh-my' || code === 'chinese' || code === '简体中文') return 'zh-CN';
    if (code === 'zh-hk' || code === 'zh-mo' || code === 'zh-tw' || code === 'zh-hant' || code === '繁體中文') return 'zh-HK';
    if (code.includes('en')) return 'en-US';
    if (code.includes('zh') || code.includes('cn') || code.includes('hk') || code.includes('tw')) {
        return code.includes('hk') || code.includes('tw') ? 'zh-HK' : 'zh-CN';
    }
    return 'en-US';
}

export function getDetectedLanguage(headers?: Headers | Record<string, string>) {
    if (typeof window === 'undefined') {
        let langHeader = '';
        if (typeof headers !== 'undefined') {
            if (typeof (headers as Headers).get === 'function') {
                langHeader = ((headers as Headers).get('accept-language')) || '';
            } else if (typeof (headers as Record<string, string>)['accept-language'] === 'string') {
                langHeader = (headers as Record<string, string>)['accept-language'];
            }
        }
        if (langHeader) {
            // Get the first language
            const firstLang = langHeader.split(',')[0];
            return normalizeLangCode(firstLang);
        }
        return 'en-US'; // Default for SSR
    }
    
    const browserLang = window.navigator.language || (window.navigator as { userLanguage?: string }).userLanguage || 'en-US';
    
    return normalizeLangCode(browserLang);
}

// Only initialize if not already initialized
if (!i18n.isInitialized) {
    i18n.use(initReactI18next)
        .init({
            debug: false,
            resources,
            fallbackLng: 'en-US',
            lng: 'en-US', // Default language
            
            interpolation: {
                escapeValue: false
            }
        });
}

export default i18n;