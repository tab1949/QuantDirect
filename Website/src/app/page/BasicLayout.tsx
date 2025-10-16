'use client';

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next"; 
import SettingsIcon from "./SVGIcons";
import ExplorePage from "./Explore/ExplorerPage";
import HomePage from "./Home/Page";
import { langName, supportedLang, languages } from "./locales/client-i18n";
import {
  Page, 
  CommonHeader, 
  HeaderElement, 
  HeaderSeparator, 
  SettingsMenuL1, 
  SettingsOption, 
  CommonBody, 
  CommonFooter,
  SettingsMenuL2
} from "./components/BasicLayout";

export default function BasicLayout() {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);
  const [settingsL1Opened, setSettingsL1Opened] = useState(false);
  const [settingsL2Opened, setSettingsL2Opened] = useState(false);
  const [settingsL2Type, setSettingsL2Type] = useState('');
  const [selected, setSelected] = useState({
    home: true, explore: false, analysis: false, community: false, help: false, dashboard: false, settings: false
  });

  type Selected = typeof selected;

  const switchPage = useCallback((nav: keyof Selected) => {
    setSelected(prev => ({ 
      ...prev, 
      home: false,
      help: nav === 'help',
      community: nav === 'community',
      analysis: nav === 'analysis',
      explore: nav === 'explore',
      dashboard: nav === 'dashboard'
    }));
  }, []);

  const openHome = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      home: true,
      explore: false,
      analysis: false,
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
    <body>
      <Page $darkMode={darkMode}>
        <CommonHeader $darkMode={darkMode}>
          <HeaderElement $selected={selected.home} onClick={openHome} 
            style={{
              fontSize: '23px',
              marginLeft: '10px',
              border: 'none'}}>
            QuantDirect
          </HeaderElement>

          <HeaderSeparator/>

          <HeaderElement $selected={selected.explore} onClick={() => switchPage('explore')}>
            {t('basic.explore')}
          </HeaderElement>

          <HeaderElement $selected={selected.analysis} onClick={() => switchPage('analysis')}>
            {t('basic.analysis')}
          </HeaderElement>

          <HeaderElement $selected={selected.community} onClick={() => switchPage('community')}>
            {t('basic.community')}
          </HeaderElement>

          <HeaderElement $selected={selected.help} onClick={() => switchPage('help')}>
            {t('basic.help')}
          </HeaderElement> 

          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
            <HeaderElement $selected={selected.dashboard} onClick={() => switchPage('dashboard')} style={{fontSize: '17px'}}>
              {t('basic.dashboard')}
            </HeaderElement>

            <HeaderElement $selected={selected.settings} onClick={openSettingsMenu} 
              itemID="header_settings">
              <SettingsIcon $color="var(--theme-icon-color)" $w={'30px'} $h={'30px'}></SettingsIcon>
            </HeaderElement>
          </div>
        </CommonHeader>

        <CommonBody $darkMode={darkMode} 
          onClick={()=>{
            setSettingsL1Opened(false); 
            setSettingsL2Opened(false);
            setSelected(prev => ({ ...prev, settings: false }));}}>
          {selected.home && <HomePage $darkMode={darkMode}/>}
          {selected.explore && <ExplorePage $darkMode={darkMode}/>}
        </CommonBody>
        
        {settingsL1Opened && SettingsMenuL1Content}
        {settingsL2Opened && SettingsMenuL2Content}

        <CommonFooter $darkMode={darkMode}>
          {t('basic.intro')}
        </CommonFooter>
      </Page> 
    </body>
  );
}