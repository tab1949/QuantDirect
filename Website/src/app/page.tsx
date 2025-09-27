'use client';

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next"; 
import CandleStickChart from "./CandleStickChart";
import SettingsIcon from "./SVGIcons";
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
} from "./HomePage";

export default function Home() {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);
  const [settingsL1Opened, setSettingsL1Opened] = useState(false);
  const [settingsL2Opened, setSettingsL2Opened] = useState(false);
  const [settingsL2Type, setSettingsL2Type] = useState('');
  const [selected, setSelected] = useState({
    home: false, explore: false, analysis: false, community: false, help: false, dashboard: false, settings: false
  });

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const openHome = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      explore: false,
      analysis: false,
      community: false,
      dashboard: false,
      help: false
    }));
  }, []);
  const openExplore = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      explore: prev.explore? prev.explore: !prev.explore,
      analysis: false,
      community: false,
      dashboard: false
    }));
  }, []);
  const openAnalysis = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      analysis: prev.analysis? prev.analysis: !prev.analysis,
      explore: false,
      community: false,
      help: false,
      dashboard: false
    }));
  }, []);
  
  const openCommunity = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      community: prev.community? prev.community: !prev.community,
      explore: false,
      analysis: false,
      help: false,
      dashboard: false
    }));
  }, []);
  const openHelp = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      help: prev.help? prev.help: !prev.help,
      explore: false,
      analysis: false,
      community: false,
      dashboard: false
    }));
  }, []);
  const openDashboard = useCallback(() => {
    setSelected(prev => ({ 
      ...prev, 
      dashboard: prev.dashboard? prev.dashboard: !prev.dashboard,
      explore: false,
      analysis: false,
      community: false,
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
  const openLanguageSettingsMenu = useCallback(() => {
    setSettingsL2Type("lang");
    setSettingsL2Opened(s => !s);
  }, []);
  const testData = {
      date: ['01/01', '01/02', '01/03', '01/04', '01/05', '01/08', '01/09', '01/10', '01/11', '01/12', '01/15'],
      open: [900, 990, 980.3, 1110, 1130, 1150, 1143, 1132, 1149, 1166, 1151.4],
      close: [980, 940, 1100, 1110, 1130, 1120, 1142, 1151, 1149, 1164.3, 1130],
      high: [1050.0, 1000.0, 1100.0, 1110.0, 1136.5, 1151, 1143, 1133.3, 1155, 1171, 1155],
      low: [880.0, 932.1, 966.0, 1110.0, 1125.5, 1120, 1142, 1131, 1142.8, 1164, 1130],
  };
  
  return (
    <body>
      <Page $darkMode={darkMode}>
        <CommonHeader $darkMode={darkMode}>
          <HeaderElement $selected={selected.home} onClick={openHome} style={{fontSize: '23px'}}>
            QuantDirect
          </HeaderElement>
          <HeaderSeparator $darkMode={darkMode}/>
          <HeaderElement $selected={selected.explore} onClick={openExplore}>
            {t('explore')}
          </HeaderElement>
          <HeaderElement $selected={selected.analysis} onClick={openAnalysis}>
            {t('analysis')}
          </HeaderElement>
          <HeaderElement $selected={selected.community} onClick={openCommunity}>
            {t('community')}
          </HeaderElement>
          <HeaderElement $selected={selected.help} onClick={openHelp}>
            {t('help')}
          </HeaderElement> 
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center'}}>
            <HeaderElement $selected={selected.dashboard} onClick={openDashboard} style={{fontSize: '17px'}}>
              {t('dashboard')}
            </HeaderElement>
            <HeaderElement $selected={selected.settings} onClick={openSettingsMenu} 
              itemID="header_settings">
              <SettingsIcon $color="var(--theme-icon-color)" $w={'30px'} $h={'30px'}></SettingsIcon>
            </HeaderElement>
          </div>
        </CommonHeader>
        <CommonBody $darkMode={darkMode}>
          {settingsL1Opened && (
          <SettingsMenuL1 $darkMode={darkMode}>
            <SettingsOption $darkMode={darkMode} onClick={()=>{setDarkMode(!darkMode)}}>
              <span>{t('theme')}</span>
              <span>({darkMode? t('dark'): t('light')})</span>
            </SettingsOption>
            <SettingsOption $darkMode={darkMode} onClick={openLanguageSettingsMenu}>
              <span>{t('language')}</span>
              <span>({i18n.language === 'en-US' ? langName[languages.EN_US] : 
                      i18n.language === 'zh-CN' ? langName[languages.ZH_CN] : langName[languages.ZH_HK]})</span>
            </SettingsOption>
          </SettingsMenuL1>)}
          {settingsL2Opened && (<SettingsMenuL2 $darkMode={darkMode}>
            {settingsL2Type == 'lang' && (
              supportedLang.map((v, i) => {
                return <SettingsOption key={`lang-opt-${i}`} $darkMode={darkMode} onClick={() => {changeLanguage(v);}}>{langName[i]}</SettingsOption>;
              })
            )}
          </SettingsMenuL2>)}
          <div style={{
            position: 'relative',
            left:'100px',
            top:'100px',
            width:'0',
            height:'0'
          }}><CandleStickChart $dark={darkMode} $width={500} $height={300} $data={testData}></CandleStickChart></div>
        </CommonBody>
        <CommonFooter $darkMode={darkMode}></CommonFooter>
      </Page> 
    </body>
  );
}
