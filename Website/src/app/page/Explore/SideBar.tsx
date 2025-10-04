import styled from "styled-components";
import * as Animation from "../Animation";

export const SideBar = styled.div<{$darkMode: boolean}>`
    user-select: none;
    position: relative;
    top: 0;
    left: 0;
    height: 100%;
    width: calc(5vw + 100px);
    background-color: ${props => props.$darkMode ? '#4b5155' : '#c6cdd2'};
    transition: background-color 500ms;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
`;

export const SideBarOptionsL1 = styled.div`
    --normal-color: var(--theme-font-color-content);
    --hover-color: var(--theme-font-color-content);
    --normal-bg-color: transparent;
    --hover-bg-color: #00000025;
    ${Animation.hover_color_change}
    position: relative;
    width: 100%;
    height: auto;
    font-size: 17px;
    display: flex;
    align-items: center;
    justify-content: start;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 10px;
`;

export const SideBarOptionsL2 = styled(SideBarOptionsL1)`
    font-size: 15px;
    width: 100%;
    padding-left: 20px;
`;