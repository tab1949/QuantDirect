'use client';

import { useState, useCallback, useRef, useEffect, useMemo, ReactElement } from "react";
import { useTranslation } from "react-i18next"; 
import Image from "next/image";
import ExplorePage from "./Explore/Page";
import HomePage from "./Home/Page";
import SettingsPage from "./Settings/Page";
import TradingPage from "./Trading/Page";
import { DATA_SOURCE_DEFAULTS, DEFAULT_SETTINGS, normalizeSettings, resolveDarkMode, resolveLanguage } from "./Settings/Page";
import i18n from "./locales/client-i18n";
import {
  Page,
  CommonHeader,
  HeaderElement,
  HeaderSeparator,
  CommonBody,
  CommonFooter,
  WindowControls,
  WindowControlButton
} from "./components/BasicLayout";
import type { ElectronAPI, WindowFrameState } from "../../types/window-controls";
import type { AppSettings } from "../../types/settings";

export { DATA_SOURCE_DEFAULTS };

function FooterClock() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
      refreshRef.current = setInterval(() => {
          const now = new Date();
          now.setUTCHours(now.getUTCHours() + 8);
          setCurrentTime(now.toISOString().slice(11, 19));
          setCurrentDate(now.toISOString().slice(0, 10));
      }, 1000);

      return () => {
          if (refreshRef.current) {
              clearInterval(refreshRef.current);
              refreshRef.current = null;
          }
      };
  }, []);

  return <div 
      style={{
          display: 'flex', 
          alignItems: 'center',
          marginLeft: 'auto',
          marginRight: '10px'
      }}>
        {'(UTC+8) '}{` ${currentDate} ${currentTime} `}
  </div>;
}

export default function BasicLayout() {
  type Page = 'home' | 'explore' | 'research' | 'trading' | 'community' | 'help' | 'dashboard' | 'settings';
  const { t } = useTranslation();
  type WindowWithElectron = Window & { electronAPI?: ElectronAPI };
  const getElectronAPI = () => (typeof window === 'undefined' ? undefined : (window as WindowWithElectron).electronAPI);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [darkMode, setDarkMode] = useState(() => resolveDarkMode(DEFAULT_SETTINGS));
  const [settingsPageOpened, setSettingsPageOpened] = useState(false);
  const [selected, setSelected] = useState<Page>('home');
  const [hasWindowControls, setHasWindowControls] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [displayScaleInfo, setDisplayScaleInfo] = useState<string | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);


  const displayScaleInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applySettings = useCallback((next: AppSettings) => {
    setDarkMode(resolveDarkMode(next));
    const targetLang = resolveLanguage(next);

    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('preferredLanguage', targetLang);
        localStorage.setItem('appSettings', JSON.stringify(next));
      } catch (error) {
        void error;
      }
    }
  }, [i18n]);

  const persistSettings = useCallback(async (next: AppSettings) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const electronAPI = getElectronAPI();
      if (electronAPI?.settings?.save) {
        await electronAPI.settings.save(next);
      } else {
        localStorage.setItem('appSettings', JSON.stringify(next));
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  }, []);

  const handleSettingsChange = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = normalizeSettings({ ...prev, ...patch });
      applySettings(next);
      void persistSettings(next);
      return next;
    });
  }, [applySettings, persistSettings]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      let loaded: AppSettings | null = null;

      if (typeof window !== 'undefined') {
        try {
          const electronAPI = getElectronAPI();
          loaded = (await electronAPI?.settings?.load()) ?? null;
        } catch (error) {
          console.error('Failed to load settings', error);
        }

        if (!loaded) {
          try {
            const stored = localStorage.getItem('appSettings');
            if (stored) {
              loaded = normalizeSettings(JSON.parse(stored) as Partial<AppSettings>);
            }
          } catch (error) {
            void error;
          }
        }
      }

      const next = normalizeSettings(loaded ?? DEFAULT_SETTINGS);
      if (cancelled) {
        return;
      }

      setSettings(next);
      applySettings(next);
      setSettingsReady(true);
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [applySettings]);

  useEffect(() => {
    if (settings.theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      setDarkMode(mediaQuery.matches);
    };

    listener();
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  const openHome = useCallback(() => {
    setSelected('home');
  }, []);

  const openSettingsMenu = useCallback(() => {
    if (settingsPageOpened) {
      setSettingsPageOpened(false);
    } else {
      setSettingsPageOpened(true);
    }
  }, [settingsPageOpened]);

  useEffect(() => {
    const electronAPI = getElectronAPI();
    if (typeof window === 'undefined' || !electronAPI) {
      setHasWindowControls(false);
      return;
    }

    setHasWindowControls(true);

    const updateState = (state: WindowFrameState) => {
      setIsMaximized(state === 'maximized' || state === 'fullscreen');
    };

    const unsubscribe = electronAPI.onWindowStateChange?.(updateState);

    electronAPI.getWindowState?.()
      .then((state) => {
        if (state) {
          updateState(state);
        }
      })
      .catch(() => undefined);

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const electronAPI = getElectronAPI();
    if (typeof window === 'undefined' || !electronAPI?.onWindowScaleChange) {
      return undefined;
    }

    const unsubscribe = electronAPI.onWindowScaleChange((scale) => {
      setDisplayScaleInfo(`${(scale * 100).toFixed(0)}%`);
      if (displayScaleInfoTimeoutRef.current) {
        clearTimeout(displayScaleInfoTimeoutRef.current);
      }
      displayScaleInfoTimeoutRef.current = setTimeout(() => {
        setDisplayScaleInfo(null);
      }, 2000);
    });

    return () => {
      if (displayScaleInfoTimeoutRef.current) {
        clearTimeout(displayScaleInfoTimeoutRef.current);
        displayScaleInfoTimeoutRef.current = null;
      }
      unsubscribe?.();
    };
  }, []);

  const handleMinimize = useCallback(() => {
    getElectronAPI()?.minimize();
  }, []);

  const handleToggleMaximize = useCallback(() => {
    getElectronAPI()?.toggleMaximize();
  }, []);

  const handleClose = useCallback(() => {
    getElectronAPI()?.close();
  }, []);

  const ScaleInfoRect = useMemo(() => displayScaleInfo ? (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--header-height) + 5px)',
        right: '5px',
        width: 'fit-content',
        height: 'fit-content',
        backgroundColor: 'var(--theme-border-color)',
        color: 'var(--theme-font-color)',
        borderRadius: '4px',
        fontSize: '16px',
        padding: '6px 12px',
        zIndex: 1000,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'opacity 1s ease-in-out',
      }}
    >
      {`${t('basic.scale')}: ${displayScaleInfo}`}
    </div>
  ) : null, [displayScaleInfo, t]);

  const page = useMemo(() => {
    let content: ReactElement | null = null;
    switch (selected) {
      case 'home':
        content = <HomePage />;
        break;
      case 'explore':
        content = <ExplorePage />;
        break;
      case 'trading':
        content = (
          <TradingPage
            settings={settings}
            settingsReady={settingsReady}
            darkMode={darkMode}
            onChange={handleSettingsChange}
          />
        );
        break;
      case 'research':
      case 'community':
      case 'help':
      case 'dashboard':
      default:
        content = null;
    }
    return <CommonBody $darkMode={darkMode} 
      onClick={()=>{
        setSettingsPageOpened(false);
      }}>
      {content}
    </CommonBody>
  }, [darkMode, handleSettingsChange, selected, settings, settingsReady]);

  return (
    <Page $darkMode={darkMode}>
        <CommonHeader $darkMode={darkMode}>
          <HeaderElement $selected={selected === 'home'} onClick={openHome} 
            style={{
              marginLeft: '10px',
              borderBottom: '0px'
            }}>
            <Image
              src="/resource/"
              alt="QuantDirect"
              width={25}
              height={25}
              style={{ display: 'block' }}
            />
          </HeaderElement>

          <HeaderSeparator/>

          <HeaderElement $selected={selected === 'explore'} onClick={() => setSelected('explore')}>
            {t('basic.explore')}
          </HeaderElement>

          <HeaderElement $selected={selected === 'research'} onClick={() => setSelected('research')}>
            {t('basic.research')}
          </HeaderElement>

          <HeaderElement $selected={selected === 'trading'} onClick={() => setSelected('trading')}>
            {t('basic.trading')}
          </HeaderElement>

          <HeaderElement $selected={selected === 'community'} onClick={() => setSelected('community')}>
            {t('basic.community')}
          </HeaderElement>

          <HeaderElement $selected={selected === 'help'} onClick={() => setSelected('help')}>
            {t('basic.help')}
          </HeaderElement> 

          <HeaderElement $selected={selected === 'settings'} onClick={openSettingsMenu} 
            itemID="header_settings">
              {t('basic.settings')}
          </HeaderElement>

          <HeaderSeparator/>

          {hasWindowControls && (
            <WindowControls>
              <HeaderSeparator/>
              <WindowControlButton
                type="button"
                aria-label="Minimize window"
                title={t('basic.minimize')}
                $darkMode={darkMode}
                onClick={handleMinimize}
              >
                <svg viewBox="0 0 12 12">
                  <path d="M2 6h8" strokeWidth="1.4" />
                </svg>
              </WindowControlButton>
              <WindowControlButton
                type="button"
                aria-label={isMaximized ? t('basic.restore') + " window" : t('basic.maximize') }
                title={isMaximized ? t('basic.restore') : t('basic.maximize')}
                $darkMode={darkMode}
                onClick={handleToggleMaximize}
              >
                {isMaximized ? (
                  <svg viewBox="0 0 12 12">
                    <path d="M4 3h5v5" />
                    <rect x="3" y="4" width="5" height="5" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 12 12">
                    <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
                  </svg>
                )}
              </WindowControlButton>
              <WindowControlButton
                type="button"
                aria-label="Close window"
                title={t('basic.close')}
                $darkMode={darkMode}
                $variant="close"
                onClick={handleClose}
              >
                <svg viewBox="0 0 12 12">
                  <path d="M3 3l6 6" />
                  <path d="M9 3L3 9" />
                </svg>
              </WindowControlButton>
            </WindowControls>
          )}

        </CommonHeader>
        {page}
        {settingsPageOpened && (
          <SettingsPage
            settings={settings}
            onChange={handleSettingsChange}
            darkMode={darkMode}
          />
        )}
        {ScaleInfoRect}
        <CommonFooter $darkMode={darkMode}>
          {/* {t('basic.intro')} */}
          <FooterClock/>
        </CommonFooter>
      </Page> 
  );
}