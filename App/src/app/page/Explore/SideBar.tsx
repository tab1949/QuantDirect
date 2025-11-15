import styled from "styled-components";
import * as Basic from "../../components/BasicLayout";

const SideBarContainer = styled.div<{$darkMode: boolean}>`
    user-select: none;
    position: relative;
    top: 0;
    left: 0;
    height: 100%;
    width: 10rem;
    background-color: ${props => props.$darkMode ? '#4b5155' : '#c6cdd2'};
    transition: background-color 300ms ease-in-out;
    align-items: flex-start;
    justify-content: flex-start;
`;

export function SideBar(args :{children: React.ReactNode, $darkMode: boolean}) {
    return <SideBarContainer $darkMode={args.$darkMode}><Basic.ScrollList>{args.children}</Basic.ScrollList></SideBarContainer>
}

export const SideBarOptionsL1 = styled(Basic.ListItem)`
    font-size: 1.1rem;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 10px;
`;

export const SideBarOptionsL2 = styled(SideBarOptionsL1)`
    font-size: 1rem;
    padding-left: 20px;
`;