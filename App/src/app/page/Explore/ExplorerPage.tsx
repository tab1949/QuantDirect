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
        setViewContent('stocks-overview');
    }, [stocksListOpened]);
    const futuresCZCE = useCallback(() => {
        setViewContent('futures-CZCE');
    }, []);
    const futuresDCE = useCallback(() => {
        setViewContent('futures-DCE');
    }, []);
    const futuresSHFE = useCallback(() => {
        setViewContent('futures-SHFE');
    }, []);
    const futuresGFEX = useCallback(() => {
        setViewContent('futures-GFEX');
    }, []);
    const futuresCFFEX = useCallback(() => {
        setViewContent('futures-CFFEX');
    }, []);
    const futuresINE = useCallback(() => {
        setViewContent('futures-INE');
    }, []);
    const stocksCN = useCallback(() => {
        setViewContent('stocks-CN');
    }, []);
    const stocksHK = useCallback(() => {
        setViewContent('stocks-HK');
    }, []);
    const stocksUS = useCallback(() => {
        setViewContent('stocks-US');
    }, []);
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
                <SideBarOptionsL2 onClick={futuresCZCE}>{t('list.CZCE')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={futuresDCE}>{t('list.DCE')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={futuresSHFE}>{t('list.SHFE')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={futuresGFEX}>{t('list.GFEX')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={futuresCFFEX}>{t('list.CFFEX')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={futuresINE}>{t('list.INE')}</SideBarOptionsL2>
            </div>}
            <SideBarOptionsL1 onClick={stocksOptionClicked}>{t('list.stocks')}{stocksListOpened? ' ↓': ' →'}</SideBarOptionsL1>
            {stocksListOpened && <div>
                <SideBarOptionsL2 onClick={stocksCN}>{t('list.CN')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={stocksHK}>{t('list.HK')}</SideBarOptionsL2>
                <SideBarOptionsL2 onClick={stocksUS}>{t('list.US')}</SideBarOptionsL2>
            </div>}
        </SideBar>
        <ViewArea $content={viewContent}/>
        </div>
    );
}