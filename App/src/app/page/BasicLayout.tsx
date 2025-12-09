'use client';

import { useState, useCallback, useRef, useEffect, useMemo, ReactElement } from "react";
import { useTranslation } from "react-i18next"; 
import Image from "next/image";
import ExplorePage from "./Explore/Page";
import HomePage from "./Home/Page";
import SettingsPage from "./Settings/Page";
import { langName, supportedLang, languages } from "../locales/client-i18n";
import {
  Page,
  CommonHeader,
  HeaderElement,
  HeaderSeparator,
  SettingsMenuL1,
  SettingsOption,
  CommonBody,
  CommonFooter,
  SettingsMenuL2,
  WindowControls,
  WindowControlButton
} from "../components/BasicLayout";
import type { WindowFrameState } from "../../types/window-controls";

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
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);
  const [settingsL1Opened, setSettingsL1Opened] = useState(false);
  const [settingsL2Opened, setSettingsL2Opened] = useState(false);
  const [settingsPageOpened, setSettingsPageOpened] = useState(false);
  const [settingsL2Type, setSettingsL2Type] = useState('');
  const [selected, setSelected] = useState<Page>('home');
  const [hasWindowControls, setHasWindowControls] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [displayScaleInfo, setDisplayScaleInfo] = useState<string | null>(null);


  const displayScaleInfoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openHome = useCallback(() => {
    setSelected('home');
  }, []);

  const openSettingsMenu = useCallback(() => {

    if (settingsL1Opened) {
      setSettingsL1Opened(false); 
      setSettingsL2Opened(false);
    } else {
      setSettingsL1Opened(true); 
    }
  }, [settingsL1Opened]);

  const openLanguageMenu = useCallback(() => {
    setSettingsL2Type("lang");
    setSettingsL2Opened(s => !s);
  }, []);

  const openTradingSettingsMenu = useCallback(() => {
    setSettingsL2Type("trading");
    setSettingsL2Opened(s => !s);
  }, []);

  const changeLanguage = useMemo(() => (lang: string) => {
    i18n.changeLanguage(lang);
  }, [i18n]);
  
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setHasWindowControls(false);
      return;
    }

    setHasWindowControls(true);

    const updateState = (state: WindowFrameState) => {
      setIsMaximized(state === 'maximized' || state === 'fullscreen');
    };

    const unsubscribe = window.electronAPI.onWindowStateChange?.(updateState);

    window.electronAPI.getWindowState?.()
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
    if (typeof window === 'undefined' || !window.electronAPI?.onWindowScaleChange) {
      return undefined;
    }

    const unsubscribe = window.electronAPI.onWindowScaleChange((scale) => {
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
    window.electronAPI?.minimize();
  }, []);

  const handleToggleMaximize = useCallback(() => {
    window.electronAPI?.toggleMaximize();
  }, []);

  const handleClose = useCallback(() => {
    window.electronAPI?.close();
  }, []);
  
  const SettingsMenuL1Content = useMemo(() => (
    <SettingsMenuL1 $darkMode={darkMode}>
      <SettingsOption $darkMode={darkMode} onClick={toggleDarkMode}>
        <span>{t('basic.theme')}</span>
        <span>({darkMode ? t('basic.dark') : t('basic.light')})</span>
      </SettingsOption>
      <SettingsOption $darkMode={darkMode} onClick={openLanguageMenu}>
        <span>{t('basic.language')}</span>
        <span>({i18n.language === 'en-US' ? langName[languages.EN_US] : 
                i18n.language === 'zh-CN' ? langName[languages.ZH_CN] : langName[languages.ZH_HK]})</span>
      </SettingsOption>
      <SettingsOption $darkMode={darkMode} onClick={openTradingSettingsMenu}>
        {`${t('basic.trading')} ...`}
      </SettingsOption>
    </SettingsMenuL1>
  ), [darkMode, i18n.language, toggleDarkMode, openLanguageMenu, openTradingSettingsMenu, t]);

  const SettingsMenuL2Content = useMemo(() => {
    switch (settingsL2Type) {
      case 'lang':
        return <SettingsMenuL2 $darkMode={darkMode}>
          {supportedLang.map((v, i) => {
          return <SettingsOption
            key={`lang-opt-${i}`}
            $darkMode={darkMode}
            onClick={() => { 
              changeLanguage(v); 
              setSettingsL2Opened(false); 
            }}>
            {langName[i]}
          </SettingsOption>;
          })}
        </SettingsMenuL2>;
      case 'trading': 
        setSettingsPageOpened(true);
    }
  }, [settingsL2Type, darkMode, changeLanguage]);

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
    setSettingsPageOpened(false);
    switch (selected) {
      case 'home':
        content = <HomePage />;
        break;
      case 'explore':
        content = <ExplorePage />;
        break;
      case 'research':
      case 'trading':
      case 'community':
      case 'help':
      case 'dashboard':
      default:
        content = null;
    }
    return <CommonBody $darkMode={darkMode} 
      onClick={()=>{
        setSettingsL1Opened(false); 
        setSettingsL2Opened(false);
      }}>
      {content}
    </CommonBody>
  }, [darkMode, selected]);

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
        {settingsPageOpened? <SettingsPage/>: page}
        {settingsL1Opened && SettingsMenuL1Content}
        {settingsL2Opened && SettingsMenuL2Content}
        {ScaleInfoRect}
        <CommonFooter $darkMode={darkMode}>
          {/* {t('basic.intro')} */}
          <FooterClock/>
        </CommonFooter>
      </Page> 
  );
}