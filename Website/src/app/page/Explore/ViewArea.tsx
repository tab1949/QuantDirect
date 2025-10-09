'use client';

import { useTranslation } from "react-i18next";
import TimeDisplay from "./TimeDisplay";
import { useState } from "react";
import { InlineT3 } from "../components/BasicLayout";

interface ViewAreaProps {
    $content: string
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
        break;
    case 'futures-CZCE':
        title = t('list.CZCE');
        break;
    case 'futures-SHFE':
        title = t('list.SHFE');
        break;
    case 'futures-GFEX':
        title = t('list.GFEX');
        break;
    case 'futures-CFFEX':
        title = t('list.CFFEX');
        break;
    case 'futures-INE':
        title = t('list.INE');
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
        <br/>
        { content } 
    </div>;
}