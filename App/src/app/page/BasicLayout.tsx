'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next"; 
import Image from "next/image";
import ExplorePage from "./Explore/ExplorerPage";
import HomePage from "./Home/Page";
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
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);
  const [settingsL1Opened, setSettingsL1Opened] = useState(false);
  const [settingsL2Opened, setSettingsL2Opened] = useState(false);
  const [settingsL2Type, setSettingsL2Type] = useState('');
  const [selected, setSelected] = useState({
    home: true, explore: false, research: false, community: false, help: false, dashboard: false, settings: false
  });
  const [hasWindowControls, setHasWindowControls] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  type Selected = typeof selected;

  const switchPage = useCallback((nav: keyof Selected) => {
    setSelected(prev => ({ 
      ...prev, 
      home: false,
      help: nav === 'help',
      community: nav === 'community',
      research: nav === 'research',
      explore: nav === 'explore',
      dashboard: nav === 'dashboard'
    }));
  }, []);

  const openHome = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      home: true,
      explore: false,
      research: false,
      community: false,
      dashboard: false,
      help: false
    }));
  }, []);

  const openSettingsMenu = useCallback(() => {
    setSelected(prev => ({ ...prev, settings: !prev.settings }));
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

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
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

  const handleMinimize = useCallback(() => {
    window.electronAPI?.minimize();
  }, []);

  const handleToggleMaximize = useCallback(() => {
    window.electronAPI?.toggleMaximize();
  }, []);

  const handleClose = useCallback(() => {
    window.electronAPI?.close();
  }, []);
  
  const SettingsMenuL1Content = (
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
    </SettingsMenuL1>
  );

  const SettingsMenuL2Content = settingsL2Type === 'lang' && (
    <SettingsMenuL2 $darkMode={darkMode}>
      {supportedLang.map((v, i) => (
        <SettingsOption 
          key={`lang-opt-${i}`} 
          $darkMode={darkMode} 
          onClick={() => { 
            changeLanguage(v); 
            setSettingsL2Opened(false); 
          }}
        >
          {langName[i]}
        </SettingsOption>
      ))}
    </SettingsMenuL2>
  );

  return (
    <Page $darkMode={darkMode}>
        <CommonHeader $darkMode={darkMode}>
          <HeaderElement $selected={selected.home} onClick={openHome} 
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

          <HeaderElement $selected={selected.explore} onClick={() => switchPage('explore')}>
            {t('basic.explore')}
          </HeaderElement>

          <HeaderElement $selected={selected.research} onClick={() => switchPage('research')}>
            {t('basic.research')}
          </HeaderElement>

          <HeaderElement $selected={selected.community} onClick={() => switchPage('community')}>
            {t('basic.community')}
          </HeaderElement>

          <HeaderElement $selected={selected.help} onClick={() => switchPage('help')}>
            {t('basic.help')}
          </HeaderElement> 

          <HeaderElement $selected={selected.settings} onClick={openSettingsMenu} 
            itemID="header_settings">
              {t('basic.settings')}
          </HeaderElement>

          <HeaderSeparator/>

          {hasWindowControls && (
            <WindowControls>
              <WindowControlButton
                type="button"
                aria-label="Minimize window"
                title="Minimize"
                $darkMode={darkMode}
                onClick={handleMinimize}
              >
                <svg viewBox="0 0 12 12">
                  <path d="M2 6h8" strokeWidth="1.4" />
                </svg>
              </WindowControlButton>
              <WindowControlButton
                type="button"
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
                title={isMaximized ? "Restore" : "Maximize"}
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
                title="Close"
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

        <CommonBody $darkMode={darkMode} 
          onClick={()=>{
            setSettingsL1Opened(false); 
            setSettingsL2Opened(false);
            setSelected(prev => ({ ...prev, settings: false }));}}>
          {selected.home && <HomePage/>}
          {selected.explore && <ExplorePage $darkMode={darkMode}/>}
        </CommonBody>
        
        {settingsL1Opened && SettingsMenuL1Content}
        {settingsL2Opened && SettingsMenuL2Content}

        <CommonFooter $darkMode={darkMode}>
          {/* {t('basic.intro')} */}
          <FooterClock/>
        </CommonFooter>
      </Page> 
  );
}