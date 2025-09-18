'use client';

import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import CandleStickChart from "./CandleStickChart";
import SettingsIcon from "./SVGIcons";
import FetchData from "./FetchData";

const color_dark_to_light = keyframes`
  from {
    background-color: black;
  } to {
    background-color: white;
  }
`;

const color_light_to_dark = keyframes`
  from {
    background-color: white;
  } to {
    background-color: black;
  }
`;

const Page = styled.div<{ $darkMode: boolean}>`
  background-color: var(--theme-background-color);
  display: grid;
  grid-row: 3;
  grid-column: 1;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  font-family: Arial, Helvetica, sans-serif;
  ${props => props.$darkMode ?
  css`animation: ${color_light_to_dark} 200ms linear 0ms 1;` :
  css`animation: ${color_dark_to_light} 200ms linear 0ms 1;`}

  --theme-background-color: ${props => props.$darkMode? '#000000' : '#ffffff'};
  --theme-font-color: ${props => props.$darkMode? '#daf1ff' : '#354146'};
  --theme-icon-color: ${props => props.$darkMode? '#dcf2ffc3' : '#354146bb'};
`;

const CommonHeader = styled.div`
  background-color: rgba(68, 142, 252, 0.744);
  position: relative;
  display: flex;
  left: 0;
  top: 0;
  width: 100vw;
  height: calc(3vh + 25px);
`;

const HeaderElement = styled.button`
  -ms-user-select: none;
  user-select: none;
  background-color: #ffffff00;
  position: relative;
  display: flex;
  justify-content: center;
  align-content: center;
  justify-self: start;
  width: fit-content;
  margin-top: auto;
  padding-left: 3px;
  padding-right: 3px;
  padding-bottom: 1vh;
  margin-left: 3px;
  margin-right: 3px;
  border-width: 0;
  font-size: 25px;
  color: var(--theme-font-color);
`;

const CommonBody = styled.div`
  position: relative;
  height: calc(94vh - 75px);
  width: 100vw;
  background-color: #8b8b8b36;
`;

const CommonFooter = styled.div`
  background-color: rgba(171, 208, 255, 0.719);
  position: relative;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: calc(3vh + 50px);
`;

const SettingsMenuL1 = styled.div`
  background-color: rgba(121, 143, 173, 0.25);
  position: fixed;
  display: grid;
  grid-column: 1;
  align-items: start;
  justify-items: start;
  width: calc(10vw + 100px);
  height: auto;
  border-radius: 5px;
  right: 1px;
`;

const SettingsMenuOptions = styled.button`
  user-select: none;
  background-color: rgba(121, 143, 173, 0.25);
  color: var(--theme-font-color);
  display: flex;
  justify-content: center;
  align-content: center;
  height: max-content;
  position: relative;
  font-size: 15px;
  width: 98%;
  margin: 2px;
  border: 0;
  border-radius: 5px;
  &:hover {
    background-color: rgba(121, 143, 173, 0.7);
  }
  transition: all 500ms;
`;

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [settingsOpened, setSettingsOpened] = useState(false);
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
        <CommonHeader>
          <HeaderElement>
            Test
          </HeaderElement>
          <HeaderElement onClick={()=>{setSettingsOpened(!settingsOpened)}} itemID="header_settings" style={{marginLeft: 'auto'}}>
            <SettingsIcon $color="var(--theme-icon-color)" $w={'30px'} $h={'30px'}></SettingsIcon>
          </HeaderElement>
        </CommonHeader>
        <CommonBody>
          {settingsOpened && (
          <SettingsMenuL1 >
            <SettingsMenuOptions onClick={()=>{setDarkMode(!darkMode)}}>Theme<br/>({darkMode? "Dark": "Light"})</SettingsMenuOptions>
            <SettingsMenuOptions>Language</SettingsMenuOptions>
          </SettingsMenuL1>)}
          <div style={{
            position: 'relative',
            left:'100px',
            top:'100px',
            width:'0',
            height:'0'
          }}><CandleStickChart $dark={darkMode} $width={500} $height={300} $data={testData}></CandleStickChart></div>
        </CommonBody>
        <CommonFooter></CommonFooter>
      </Page> 
    </body>
  );
}
