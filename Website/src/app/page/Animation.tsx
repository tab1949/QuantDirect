import {css, keyframes} from 'styled-components';

export const color_dark_to_light = keyframes`
  from {
    background-color: black;
  } to {
    background-color: white;
  }
`;

export const color_light_to_dark = keyframes`
  from {
    background-color: white;
  } to {
    background-color: black;
  }
`;

export const hover_color_change = css`
    background-color: var(--normal-bg-color);
    color: var(--normal-color);
    &:hover {
        background-color: var(--hover-bg-color);
        color: var(--hover-color);
    }
    transition: background-color 200ms linear;
`;