'use client';

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SideBar, SideBarOptionsL1, SideBarOptionsL2 } from "./SideBar";
import ViewArea from "./ViewArea";

interface ExplorePageProps {
    $darkMode: boolean;
}

export default function ExplorePage(props: ExplorePageProps) {
    const { t } = useTranslation('explore');
    const [futuresListOpened, setFuturesListOpened] = useState(false);
    const [stocksListOpened, setStocksListOpened] = useState(false);
    const [viewContent, setViewContent] = useState('overview');
    const overviewOptionClicked = useCallback(() => {
        setViewContent('overview');
    }, []);
    const futuresOptionClicked = useCallback(() => {
        setFuturesListOpened(!futuresListOpened);
        setViewContent('futures-overview');
    }, [futuresListOpened]);
    const stocksOptionClicked = useCallback(() => {
        setStocksListOpened(!stocksListOpened);
    }, [stocksListOpened]);
    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            transition: 'opacity 200ms ease-in',
            opacity: '1'
        }}>
        <SideBar $darkMode={props.$darkMode}>
            <SideBarOptionsL1 onClick={overviewOptionClicked}>{t('list.overview')}{' →'}</SideBarOptionsL1>
            <SideBarOptionsL1 onClick={futuresOptionClicked}>{t('list.futures')}{futuresListOpened? ' ↓': ' →'}</SideBarOptionsL1>
            {futuresListOpened && <div>
                <SideBarOptionsL2>{t('list.CZCE')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.DCE')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.SHFE')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.GFEX')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.CFFEX')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.INE')}</SideBarOptionsL2>
            </div>}
            <SideBarOptionsL1 onClick={stocksOptionClicked}>{t('list.stocks')}{stocksListOpened? ' ↓': ' →'}</SideBarOptionsL1>
            {stocksListOpened && <div>
                <SideBarOptionsL2>{t('list.CN')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.HK')}</SideBarOptionsL2>
                <SideBarOptionsL2>{t('list.US')}</SideBarOptionsL2>
            </div>}
        </SideBar>
        <ViewArea $content={viewContent}/>
        </div>
    );
}