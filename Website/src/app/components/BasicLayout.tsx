import {styled, css } from "styled-components";
import * as Animation from "../page/Animation";

export const Page = styled.div<{ $darkMode: boolean}>`
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
  css`animation: ${Animation.color_light_to_dark} 200ms linear 0ms 1;` :
  css`animation: ${Animation.color_dark_to_light} 200ms linear 0ms 1;`}

  --header-height: calc(3vh + 25px);
  --theme-background-color: ${props => props.$darkMode? '#0f0f0f' : '#f1f3f4'};
  --theme-font-color: ${props => props.$darkMode? '#a8b2c0' : '#6e7c8e'};
  --theme-font-color-content: ${props => props.$darkMode? '#c5cfdd' : '#4a525c'};
  --theme-font-color-hover: ${props => props.$darkMode? '#d1d9e6' : '#374151'};
  --theme-icon-color: ${props => props.$darkMode? '#b8c2d0' : '#6b7280'};
  --theme-accent-color: ${props => props.$darkMode? '#5a6470' : '#9ca3af'};
  --theme-border-color: ${props => props.$darkMode? '#3a4149' : '#d1d5db'};
`;

export const CommonHeader = styled.div<{ $darkMode: boolean}>`
  background-color: ${props => props.$darkMode ? 'rgba(58, 65, 73, 0.8)' : 'rgba(209, 213, 219, 0.85)'};
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--theme-border-color);
  position: relative;
  display: flex;
  left: 0;
  top: 0;
  width: 100vw;
  height: var(--header-height);
`;

export const HeaderElement = styled.div<{$selected: boolean}>`
  -ms-user-select: none;
  user-select: none;
  --normal-bg-color: #ffffff00;
  --hover-bg-color: #ffffff00;
  --normal-color: var(--theme-font-color);
  --hover-color: var(--theme-font-color-hover);
  ${Animation.hover_color_change}
  position: relative;
  display: flex;
  justify-items: center;
  align-items: center;
  justify-self: start;
  width: fit-content;
  padding-left: 3px;
  padding-right: 5px;
  margin: 2px;
  margin-left: 5px;
  margin-right: 10px;
  border-width: 0;
  border-bottom: ${props => props.$selected ? "3px solid var(--theme-accent-color)": ""};
  font-size: 19px;
  
`;

export function HeaderSeparator({ $darkMode }: { $darkMode: boolean }) {
  return <div style={{
    position: 'relative',
    height: '90%',
    width: '2px',
    backgroundColor: $darkMode ? 'rgba(184, 194, 208, 0.3)' : 'rgba(107, 114, 128, 0.4)',
    alignSelf: 'center',
    borderRadius: '1px',
    marginLeft: '5px',
    marginRight: '20px'
  }}/>;
}

export const CommonBody = styled.div<{ $darkMode: boolean}>`
  user-select: none;
  position: relative;
  height: calc(97vh - 75px);
  width: 100vw;
  background-color: ${props => props.$darkMode ? 'rgba(26, 32, 44, 0.15)' : 'rgba(229, 231, 235, 0.3)'};
  border-top: 1px solid var(--theme-border-color);
`;

export const CommonFooter = styled.div<{ $darkMode: boolean}>`
  user-select: none;
  background-color: ${props => props.$darkMode ? 'rgba(58, 65, 73, 0.6)' : 'rgba(209, 213, 219, 0.6)'};
  color: var(--theme-font-color);
  border-top: 1px solid var(--theme-border-color);
  position: relative;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: calc(50px);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
`;

export const SettingsMenuL1 = styled.div<{ $darkMode: boolean}>`
  background-color: ${props => props.$darkMode ? 'rgba(58, 65, 73, 0.9)' : 'rgba(243, 244, 246, 0.95)'};
  backdrop-filter: blur(12px);
  border: 1px solid var(--theme-border-color);
  box-shadow: ${props => props.$darkMode ? 
    '0 10px 25px rgba(255, 255, 255, 0.1)' : 
    '0 10px 25px rgba(0, 0, 0, 0.1)'};
  position: fixed;
  --width: calc(5vw + 120px);
  width: var(--width);
  height: auto;
  top: calc(var(--header-height) + 2px);
  right: 1px;
  display: grid;
  grid-column: 1;
  align-items: start;
  justify-items: start;
  border-radius: 8px;
`;

export const SettingsMenuL2 = styled(SettingsMenuL1)`
    position: fixed;
    right: calc(var(--width) + 3px);
    width: auto;
    height: auto;
`;

export const SettingsOption = styled.div<{ $darkMode: boolean}>`
  user-select: none;
  --normal-bg-color: rgba(121, 143, 173, 0.087);
  --hover-bg-color: ${props => props.$darkMode ? 'rgba(90, 100, 112, 0.3)' : 'rgba(209, 213, 219, 0.6)'};
  --normal-color: var(--theme-font-color);
  --hover-color: var(--theme-font-color-hover);
  ${Animation.hover_color_change}
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: max-content;
  position: relative;
  font-size: 15px;
  width: 98%;
  margin: 2px;
  padding: 5px 10px;
  border: 0;
  border-radius: 6px;
`;