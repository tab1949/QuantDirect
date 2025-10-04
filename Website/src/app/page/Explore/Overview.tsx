'use client';

import { useRef, useState } from "react";
import { InlineT1, InlineT2, InlineT3 } from "../components/BasicLayout";
import { useTranslation } from "react-i18next";
import CandleStickChart from "../components/CandleStickChart";

function Title() {
    const { t } = useTranslation('explore');
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const refreshRef = useRef(setInterval(() => {
        const now = new Date;
        now.setUTCHours(now.getUTCHours() + 8);
        setCurrentTime(now.toISOString().slice(11, 19));
        setCurrentDate(now.toISOString().slice(0, 10));
    }, 1000));
    return <div style={{display: 'flex', alignItems: 'center'}}>
        <InlineT2>{t('list.overview')}</InlineT2>
        <InlineT3 style={{fontSize: '20px', marginLeft: 'auto'}}>{t('now')}{` ${currentDate}`}{' (UTC+8) '}</InlineT3>
        <InlineT2>{currentTime}</InlineT2>
    </div>;
}

export default function Overview() {
    const { t } = useTranslation('explore');
    
    return <div>
        <Title/>
        <InlineT3>{t('notice')}</InlineT3>
    </div>;
}