import styled from "styled-components";
import * as Basic from "../../components/BasicLayout";

const SideBarContainer = styled.div`
    user-select: none;
    position: relative;
    top: 0;
    left: 0;
    height: 100%;
    width: 125px;
    background-color: var(--theme-sidebar-bg-color);
    transition: background-color 300ms ease-in-out;
    align-items: flex-start;
    justify-content: flex-start;
`;

export function SideBar(args: {children: React.ReactNode}) {
    return <SideBarContainer>
        <Basic.ScrollList>
            {args.children}
        </Basic.ScrollList>
    </SideBarContainer>;
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