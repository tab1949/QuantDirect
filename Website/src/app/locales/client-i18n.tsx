'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import lang_ZH_CN from './zh-CN.json';
import lang_ZH_HK from './zh-HK.json';
import lang_EN_US from './en-US.json';

export const supportedLang = ['en-US', 'zh-CN', 'zh-HK'];
export const langName = ['English', '简体中文', '繁體中文'];
export enum languages {EN_US, ZH_CN, ZH_HK};

const resources = {
    en_US: {translation: lang_EN_US},
    zh_CN: {translation: lang_ZH_CN},
    zh_HK: {translation: lang_ZH_HK},
    'en-US': {translation: lang_EN_US},
    'zh-CN': {translation: lang_ZH_CN},
    'zh-HK': {translation: lang_ZH_HK}
};

// Only initialize if not already initialized
if (!i18n.isInitialized) {
    i18n.use(initReactI18next)
        .init({
            resources,
            fallbackLng: 'en-US',
            debug: process.env.NODE_ENV === 'development',
            lng: 'en-US', // Default language
            
            interpolation: {
                escapeValue: false
            }
        });
}

export default i18n;
