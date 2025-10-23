'use client';

import { useEffect, useRef, useState } from "react";
import { InlineT2, InlineT3 } from "../components/BasicLayout";
import { useTranslation } from "react-i18next";

interface TimeDisplayProps {
    $title: string
}

export default function TimeDisplay(props: TimeDisplayProps) {
    const { t } = useTranslation('explore');
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const refreshRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        refreshRef.current = setInterval(() => {
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 8);
            setCurrentTime(now.toISOString().slice(11, 19));
            setCurrentDate(now.toISOString().slice(0, 10));
        }, 1000);

        return () => {
            if (refreshRef.current) {
                clearInterval(refreshRef.current);
                refreshRef.current = null;
            }
        };
    }, []);

    return <div 
        style={{
            display: 'flex', 
            alignItems: 'center',
        }}>
        <InlineT2>{props.$title}</InlineT2>
        <InlineT3 style={{marginLeft: 'auto'}}>{t('now')}{' (UTC+8) '}{` ${currentDate}`}</InlineT3>
        <InlineT2>{currentTime}</InlineT2>
    </div>;
}