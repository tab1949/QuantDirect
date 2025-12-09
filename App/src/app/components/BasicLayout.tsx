import {styled, css } from "styled-components";
import * as Animation from "../page/Animation";

export const Page = styled.div<{ $darkMode: boolean}>`
  background-color: var(--theme-background-color);
  display: flex;
  flex-direction: column;
  position: relative;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  font-family: Arial, Helvetica, sans-serif;
  ${props => props.$darkMode ?
  css`animation: ${Animation.color_light_to_dark} 200ms linear 0ms 1;` :
  css`animation: ${Animation.color_dark_to_light} 200ms linear 0ms 1;`}

  --header-height: calc(40px);
  --theme-background-color: ${props => props.$darkMode? '#0f0f0f' : '#f1f3f4'};
  --theme-chart-bg-color: ${props => props.$darkMode? '#151515' : '#f9f9f9'};
  --theme-chart-scale-color: ${props => props.$darkMode? '#d8d8d8' : '#4c4c4c'};
  --theme-chart-border-color: ${props => props.$darkMode? '#ffffff' : '#000000'};
  --theme-font-color: ${props => props.$darkMode? '#a8b2c0' : '#6e7c8e'};
  --theme-font-color-content: ${props => props.$darkMode? '#c5cfdd' : '#4a525c'};
  --theme-font-color-hover: ${props => props.$darkMode? '#d1d9e6' : '#374151'};
  --theme-icon-color: ${props => props.$darkMode? '#b8c2d0' : '#6b7280'};
  --theme-accent-color: ${props => props.$darkMode? '#5a6470' : '#9ca3af'};
  --theme-border-color: ${props => props.$darkMode? '#3a4149' : '#d1d5db'};
  --theme-separator-color: ${props => props.$darkMode ? 'rgba(184, 194, 208, 0.3)' : 'rgba(107, 114, 128, 0.4)'};
  --theme-sidebar-bg-color: ${props => props.$darkMode ? '#4b5155' : '#c6cdd2'};
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
  -webkit-app-region: drag;
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
  font-size: 16px;
  font-weight: ${props => props.$selected ? "600": "520"};
  -webkit-app-region: no-drag;
  
`;

export function HeaderSeparator() {
  return <div style={{
    position: 'relative',
    height: '80%',
    width: '2px',
    backgroundColor: 'var(--theme-separator-color)',
    alignSelf: 'center',
    borderRadius: '1px',
    marginLeft: '5px',
    marginRight: '20px'
  }}/>;
}

export const WindowControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
`;

export const WindowControlButton = styled.button<{ $darkMode: boolean; $variant?: 'close'}>`
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  padding: 0;
  cursor: pointer;
  color: var(--theme-icon-color);
  transition: background-color 150ms ease, color 150ms ease;

  &:hover {
    background-color: ${props => props.$variant === 'close'
      ? 'rgba(239, 68, 68, 0.9)'
      : props.$darkMode ? 'rgba(90, 100, 112, 0.35)' : 'rgba(209, 213, 219, 0.6)'};
    color: ${props => props.$variant === 'close' ? '#ffffff' : 'var(--theme-font-color-hover)'};
  }

  &:active {
    filter: brightness(0.95);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-accent-color);
    outline-offset: -2px;
  }

  svg {
    width: 20px;
    height: 20px;
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const CommonBody = styled.div<{ $darkMode: boolean}>`
  user-select: none;
  position: relative;
  height: calc(100vh - 70px);
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
  height: 30px;
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
  --width: 160px;
  width: var(--width);
  height: auto;
  top: calc(var(--header-height) + 2px);
  left: 1px;
  display: grid;
  grid-column: 1;
  align-items: start;
  justify-items: start;
  border-radius: 8px;
`;

export const SettingsMenuL2 = styled(SettingsMenuL1)`
    position: fixed;
    left: calc(var(--width) + 3px);
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
  font-size: 14px;
  width: 98%;
  margin: 2px;
  padding: 5px 10px;
  border: 0;
  border-radius: 6px;
`;

export const Div = styled.div`
  color: var(--theme-font-color-content);
`;

export const Title1 = styled.div`
  color: var(--theme-font-color-content);
  font-size: calc(2vmin + 33px);
  margin: 5px;
`;

export const Title2 = styled.div`
  color: var(--theme-font-color-content);
  font-size: calc(2vmin + 21px);
  margin: 3px;
`;

export const Title3 = styled.div`
  color: var(--theme-font-color-content);
  font-size: calc(2vmin + 17px);
  margin: 3px;
`;

export const InlineT1 = styled.span`
  color: var(--theme-font-color-content);
  font-size: 2.3rem;
  width: auto;
  margin: 5px;
`;

export const InlineT2 = styled(InlineT1)`
  font-size: 2.1rem;
  margin: 3px;
`;

export const InlineT3 = styled(InlineT2)`
  font-size: 1.3rem;
`;

export const ScrollList = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: transparent;
  margin: 0px;
  border-width: 3px;
  border-radius: 5px;
  border-color: var(--theme-border-color);
  overflow-y: scroll;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 0px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--theme-accent-color);
    border-radius: 5px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--theme-font-color);
  }

`;

export const ListItem = styled.div`
  --normal-color: var(--theme-font-color);
  --hover-color: var(--theme-font-color-content);
  --normal-bg-color: transparent;
  --hover-bg-color: #00000025;
  ${Animation.hover_color_change}
  position: relative;
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: start;
`;

export const HorizontalLine = styled.div<{$width: string, $length: string, $align: string}>`
  position: relative;
  background-color: var(--theme-separator-color);
  height: ${props=>props.$width};
  width: ${props=>props.$length};
  align-self: ${props=>props.$align};
  margin: 2px;
`;