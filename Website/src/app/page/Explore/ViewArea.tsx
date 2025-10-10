'use client';

import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TimeDisplay from "./TimeDisplay";
import * as FetchData from "./FetchData";
import { HorizontalLine, InlineT3, ScrollList, ListItem } from "../components/BasicLayout";
import { useState, useEffect } from "react";

interface ViewAreaProps {
    $content: string
}

const ContractListItem = styled(ListItem)`
    font-size: 23px;
    padding: 5px;
`;

interface FuturesContentProps {
    exchange: string;
}

function FuturesContent({ exchange }: FuturesContentProps) {
    const { t } = useTranslation('explore');
    const [assets, setAssets] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {(async () => {
        try {
            setLoading(true);
            setError(null);
            setAssets((await FetchData.GetSubjectAssets(exchange)).name || []);
        } catch (err) {
            setError(`${t('fetch_failed')}: ${err}`);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    })(); }, [exchange]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            height: "calc(100vh - 180px)",
            gap: "10px",
            padding: "10px"
        }}>
            <div style={{
                width: "15%",
                minWidth: "100px",
                height: "100%",
                borderRadius: "8px",
                border: "2px solid var(--theme-border-color)",
            }}>
                <ScrollList>
                    {loading ? (
                        <ContractListItem>{t('loading')}</ContractListItem>
                    ) : error ? (
                        <ContractListItem style={{ color: 'red' }}>{error}</ContractListItem>
                    ) : assets.length === 0 ? (
                        <ContractListItem>{t('no_data')}</ContractListItem>
                    ) : (
                        assets.map((asset, index) => (
                            <ContractListItem key={`${asset}-${index}`}>
                                {asset}
                            </ContractListItem>
                        ))
                    )}
                </ScrollList>
            </div>
            
            <div style={{
                flex: "1",
                height: "100%",
                border: "2px solid var(--theme-border-color)",
                borderRadius: "8px",
                backgroundColor: "transparent"
            }}>
            </div>
        </div>
    );
}

export default function ViewArea(props: ViewAreaProps) {
    const { t } = useTranslation('explore');
    let title: string = '';
    let content = null;
    switch (props.$content) {
    case 'futures-overview':
        title = t('list.futures');
        break;
    case 'stocks-overview':
        title = t('list.stocks');
        break;
    case 'futures-DCE':
        title = t('list.DCE');
        content = <FuturesContent exchange="DCE" />;
        break;
    case 'futures-CZCE':
        title = t('list.CZCE');
        content = <FuturesContent exchange="CZCE" />;
        break;
    case 'futures-SHFE':
        title = t('list.SHFE');
        content = <FuturesContent exchange="SHFE" />;
        break;
    case 'futures-GFEX':
        title = t('list.GFEX');
        content = <FuturesContent exchange="GFEX" />;
        break;
    case 'futures-CFFEX':
        title = t('list.CFFEX');
        content = <FuturesContent exchange="CFFEX" />;
        break;
    case 'futures-INE':
        title = t('list.INE');
        content = <FuturesContent exchange="INE" />;
        break;
    case 'stocks-CN':
        title = t('list.CN');
        break;
    case 'stocks-HK':
        title = t('list.HK');
        break;
    case 'stocks-US':
        title = t('list.US');
        break;
    default:
    case 'overview':
        title = t('list.overview');
        content = (
            <div style={{
                position: "absolute",
                bottom: "0",
                width: "100%",
                display: "flex",
                justifyContent: "center"
            }}>
                <InlineT3>{t('notice')}</InlineT3>
            </div>
        );
        break;
    }
    return <div style={{
        userSelect: "none",
        backgroundColor: "transparent",
        position: "relative",
        width: "calc(95vw - 100px)",
        height: "100%",
        color: "white",
        display: "flex",
        flexDirection: "column",
    }}> 
        <TimeDisplay $title={title}/>
        <HorizontalLine $width="5px" $length="99%" $align="center"/>
        { content } 
    </div>;
}