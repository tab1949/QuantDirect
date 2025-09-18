'use client';

import Image from "next/image";
import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import CandleStickChart from "./CandleStickChart";
import SettingsIcon from "./SVGIcons";

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
          }}><CandleStickChart $dark={darkMode} $width={500} $height={300}></CandleStickChart></div>
        </CommonBody>
        <CommonFooter></CommonFooter>
      </Page> 
    </body>
  );
}
