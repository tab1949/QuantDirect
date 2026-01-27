import { useState, useEffect, useMemo, ReactElement, memo } from "react";
import { useTranslation } from "react-i18next";

import { CandleStickChartData, MAIN_CHART_INDICATOR_OPTIONS, Indicator, IndicatorDisplay } from '../utils/MarketData';
import * as Indicators from "../utils/Indicators";

export interface CandleStickChartContentInterface {
    data: {
        data: CandleStickChartData;
        max: number;
        min: number;
    };
    displayRange: {
        begin: number;
        end: number;
    };
    fontSize: number;
    position: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    offset: {
        left: number;
        top: number;
        bottom: number;
        right?: number;
    }
    aim?: {
        x: number;
        y: number;
    }
    showXAxis?: boolean;
};

const validateChartData = (data: CandleStickChartData, displayRange: {begin: number, end: number}) => {
    if (!data || data.length() === 0) return false;
    if (displayRange.begin < 0 || 
        displayRange.end < 0 || 
        displayRange.begin >= data.length() || 
        displayRange.end >= data.length() ||
        displayRange.begin > displayRange.end) 
        return false;
    return true;
};

const AIM_INFO_FIELDS = ['time','open', 'close', 'high', 'low', 'volume', 'amount', 'open_interest'];

export const CandleStickChart = memo(function ContentImpl({ param }: {param: CandleStickChartContentInterface}) {
    const offset = param.offset;
    const displayRange = param.displayRange;
    const yScaleCount = 4;
    const [indicatorName, setIndicatorName] = useState('MA');
    const [indicatorValueText, setIndicatorValueText] = useState<string[]>([]);
    const [indicatorValueDesc, setIndicatorValueDesc] = useState<string[]>([]);
    const data = param.data.data;
    const svgW = param.position.width - offset.left - (offset.right || 0);
    const svgH = param.position.height - offset.top - offset.bottom;
    const bottomH = offset.bottom;
    const displayCount = displayRange.end - displayRange.begin + 1;
    let { t } = useTranslation('explore');

    const indicator = useMemo<Indicator>(() => {
        return Indicators.GetIndicatorByName(indicatorName) as Indicator;
    }, [indicatorName]); 

    // Calculation of important properties
    const p = useMemo(() => {
        if (!validateChartData(data, displayRange)) {
            return {
                fontSize: param.fontSize,
                scales: {
                    y: {
                        count: yScaleCount,
                        space: svgH / (yScaleCount - 1),
                        value: [0, 0, 0, 0] 
                    }
                },
                data: {
                    high: param.data.max,
                    low: param.data.min
                }
            };
        }

        let high = param.data.max;
        let low = param.data.min;
        const yScaleValue: Array<number> = [];
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (data.data[i].high === undefined || data.data[i].low === undefined) continue; // Only check data existence

            let indMax = high;
            let indMin = low;
            for (const ind of indicator.data) {
                if (ind[i] > indMax)
                    indMax = ind[i];
                if (ind[i] != -1 && ind[i] < indMin)
                    indMin = ind[i];
            }
            const highVal = Math.max(data.data[i].high, indMax);
            const lowVal = Math.min(data.data[i].low, indMin);
            
            if (highVal > high) high = highVal;
            if (lowVal < low) low = lowVal;
        }
        
        const yScaleRange = high - low;
        if (yScaleRange > 0) 
            for (let i = 0; i < yScaleCount; ++i)
                yScaleValue.push(high - yScaleRange / (yScaleCount - 1) * i);
        else 
            for (let i = 0; i < yScaleCount; ++i)
                yScaleValue.push(high);

        return {
            fontSize: param.fontSize,
            scales: {
                y: {
                    count: yScaleCount,
                    space: svgH / (yScaleCount - 1),
                    value: yScaleValue
                }
            },
            data: {
                high,
                low
            }
        }
    }, [yScaleCount, svgH, data, displayRange, indicator.data, param.data.max, param.data.min, param.fontSize]);

    const yScale = useMemo(() => {
        const ret: ReactElement[] = [];
        for (let i = 0; i < p.scales.y.count; ++i) {
            const y = i * p.scales.y.space;
            ret.push(<line key={`scale-y-line-${i}`} x1={0} x2={svgW + offset.left} y1={y} y2={y}  stroke={'#808080'} strokeWidth={0.8} strokeDasharray={'5 5'}/>)
            ret.push(<text key={`scale-y-text-${i}`} x={5} y={y + p.fontSize} fill={'#808080'} fontSize={p.fontSize}>
                {p.scales.y.value[i].toFixed(2)}
            </text>);
        }
        return ret;
    }, [svgW, offset.left, p.scales.y.count, p.scales.y.space, p.scales.y.value, p.fontSize]); 
    
    const xScale = useMemo(() => {
        const ret: ReactElement[] = [];
        const scaleCount = displayCount <= 5 ? displayCount : 20;
        const space = svgW / scaleCount;
        const space2nd = space / 5;
        const y = svgH + bottomH * 0.2;
        const mainTickLength = Math.min(20, bottomH * 0.5);
        const subTickLength = Math.min(10, bottomH * 0.3);
        for (let i = 0, k = displayRange.begin; i < scaleCount; ++i, ++k) {
            const x = i * space + offset.left;
            ret.push(<line key={`scale-x-${i}-0`} x1={x} x2={x} y1={y} y2={y + mainTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'2px'}/>);
            ret.push(<line key={`scale-x-${i}-1`} x1={x+space2nd} x2={x+space2nd} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-2`} x1={x+space2nd*2} x2={x+space2nd*2} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-3`} x1={x+space2nd*3} x2={x+space2nd*3} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-4`} x1={x+space2nd*4} x2={x+space2nd*4} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        }
        return ret;
    }, [displayCount, svgW, svgH, bottomH, displayRange.begin, offset.left]); 

    useEffect(() => {
        const desc: string[] = [];
        indicator.param.forEach((value) => {
            desc.push(value.describe);
        });
        setIndicatorValueDesc(desc);
        indicator.updateData(data);
    }, [indicator, data]);

    const chart = useMemo(() => {
        const ret: ReactElement[] = [];

        if (!validateChartData(data, displayRange))
            return ret;
        
        const dataRange = p.data.high - p.data.low;
        const unitY = (dataRange > 0? svgH / dataRange: 0);
        const width = svgW / displayCount;
        const bodyWidth = displayCount >= 70 ? width * 0.2 : width * 0.5;
        const sample = (displayCount <= 5? 1: Math.round(displayCount/10));
        const labelY = svgH + offset.bottom * 0.2 + 20 + p.fontSize;

        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            if (data.data[k].high === undefined || data.data[k].low === undefined || data.data[k].open === undefined || data.data[k].close === undefined) continue; // Only check data existence
            
            const x = offset.left + width * i;
            const height = unitY * ((data.data[k].open as number) - (data.data[k].close as number));
            const bodyY = unitY * (p.data.high - ((height > 0? data.data[k].open: data.data[k].close) as number));
            const wickY1 = unitY * (p.data.high - (data.data[k].high as number));
            const wickY2 = unitY * (p.data.high - (data.data[k].low as number));

            if (height < 0) { // rise
                ret.push(<g key={`candle-${i}`}>
                    <rect key={`candle-${i}-body`} x={x-bodyWidth/2} width={bodyWidth} y={bodyY} height={-height} fill="red" stroke="red" strokeWidth={2}/>
                    <line key={`candle-${i}-wick`} x1={x} x2={x} y1={wickY1} y2={wickY2} stroke="red" strokeWidth={1}/>
                </g>);
            }
            else if (height > 0) { // fall
                ret.push(<g key={`candle-${i}`}>
                    <rect key={`candle-${i}-body`} x={x-bodyWidth/2} width={bodyWidth} y={bodyY} height={height} fill="green" stroke="green" strokeWidth={2}/>
                    <line key={`candle-${i}-wick`} x1={x} x2={x} y1={wickY1} y2={wickY2} stroke="green" strokeWidth={1}/>
                </g>);
            }
            else {
                ret.push(<g key={`candle-${i}`}>
                    <line key={`candle-${i}-body`} x1={x-bodyWidth/2} x2={x+bodyWidth/2} y1={bodyY} y2={bodyY} stroke="var(--theme-chart-border-color)" strokeWidth={2}/>
                    <line key={`candle-${i}-wick`} x1={x} x2={x} y1={wickY1} y2={wickY2} stroke="var(--theme-chart-border-color)" strokeWidth={1}/>
                </g>);
            }            

            if (i % sample === 0 && data.data[k].time) {
                const timeStr = data.data[k].time;
                let text = '?';
                if (timeStr.includes(' ')) {
                    // YYYY-MM-DD HH:mm:SS -> HH:mm
                    const timePart = timeStr.split(' ')[1];
                    text = timePart.replace(/:\d\d$/, ''); 
                } else if (timeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // YYYY-MM-DD -> MM-DD
                    text = timeStr.substring(5); 
                }
                ret.push(<text key={`scale-x-${i}-t`} x={x-5} y={labelY} fill={'var(--theme-chart-scale-color)'} fontSize={p.fontSize-3}>
                    {text}
                </text>);
            }
        }
        
        const indicatorData: string[] = Array(indicator.param.length).fill('');            
        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            const x = offset.left + width * i;
            if (k > 0)
            for (let d = 0; d < indicator.param.length; ++d) {
                switch(indicator.param[d].display) {
                case IndicatorDisplay.LINE:
                    if (!indicator.data[d] || indicator.data[d][k] == -1)
                        break;
                    let lastY = indicator.data[d][k - 1];
                    let lastX = x - width;
                    if (lastY == -1) {
                        lastY = indicator.data[d][k];
                        lastX = x;
                    }
                    indicatorData[d] += `M ${lastX} ${unitY*(p.data.high-lastY)} L ${x} ${unitY*(p.data.high-indicator.data[d][k])} `;
                    break;
                default: break;
                }
            }
        }
        for (let i = 0; i < indicator.param.length; ++i) {
            switch (indicator.param[i].display) {
            case IndicatorDisplay.LINE:
                ret.push(<path key={`indicator=${i}`} d={indicatorData[i]} stroke={indicator.param[i].style.color} strokeWidth={indicator.param[i].style.weight}/>);
                break;
            default: break;
            }
        }
        return ret;
    }, [data, svgW, svgH, offset.left, offset.bottom, p.data.high, p.data.low, p.fontSize, displayRange, displayCount, indicator.data, indicator.param]);

    const aimPos = param.aim;

    const aim = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!aimPos || !p.data.high || !p.data.low)
            return ret;
        if (aimPos.y <= offset.top)
            return ret;
        const stickWidth = svgW / displayCount;
        let index = Math.round(aimPos.x / stickWidth);
        if (index < 0) 
            index = 0;
        else if (index >= displayCount) 
            index = displayCount - 1;
        const x = offset.left + stickWidth * index;
        const y = aimPos.y - offset.top;
        const value = p.data.high - (p.data.high - p.data.low) * (y / svgH);
        ret.push(<line key="aim-v" x1={x} x2={x} y1={0} y2={svgH + offset.top + bottomH} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        if(aimPos.y < offset.top + svgH) {
            ret.push(<line key="aim-h" x1={offset.left} x2={offset.left + svgW} y1={y} y2={y} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<rect key="aim-indicator" x={5} y={y-p.fontSize/2-2} height={p.fontSize+4} width={offset.left - 5} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
            ret.push(<text key="aim-indicator-text" x={6} y={y+p.fontSize/2-2} fill={'var(--theme-chart-scale-color)'} fontSize={p.fontSize}>{value.toFixed(2)}</text>);
        }
        let infoX = offset.left;
        const infoWidth = p.fontSize * 11;
        if (x < offset.left + svgW / 2)
            infoX += svgW - infoWidth;
        ret.push(<rect key="aim-info" x={infoX} y={0} width={infoWidth} height={p.fontSize*10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
        index += displayRange.begin;
        if (index < 0) 
            index = 0;
        else if (index >= data.length()) 
            index = data.length() - 1;
        const info = [
            data.data[index].time.replace(/:\d\d$/, ''), 
            data.data[index].open, 
            data.data[index].close, 
            data.data[index].high, 
            data.data[index].low, 
            data.data[index].volume, 
            data.data[index].amount, 
            data.data[index].open_interest];
        for(let i = 0; i < info.length; i++) {
          ret.push(<text key={`aim-info-text-${i}`} x={infoX + 5} y={p.fontSize + i * p.fontSize * 1.2} fontSize={p.fontSize} fill="var(--theme-chart-scale-color)">{`${t(`data_fields.${AIM_INFO_FIELDS[i]}`)}: ${info[i]}`}</text>);
        } 
        return ret;
    }, [aimPos, svgW, svgH, offset.left, offset.top, bottomH, displayRange.begin, displayCount, p.fontSize, p.data.high, p.data.low, data, t]);

    useEffect(() => {
        if (!aimPos)
            return;
        const stickWidth = svgW / displayCount;
        const index = Math.round(aimPos.x / stickWidth) + displayRange.begin;
        if (index < displayRange.begin || index > displayRange.end) return;
        const iv: string[] = [];
        for (let i = 0; i < indicator.param.length; ++i)
            if (indicator.data[i] && indicator.data[i][index])
                iv.push(`${indicator.data[i][index] == -1? '--': indicator.data[i][index].toFixed(2)}`);
        setIndicatorValueText(iv);
    }, [aimPos, displayRange, indicator.param.length, indicator.data, svgW, displayCount]);

    t = useTranslation('basic').t;
    return <div style={{
        position: 'relative',
        left: `${param.position.left}px`,
        top: `${param.position.top}px`,
        width: `${param.position.width}px`,
        height: `${param.position.height}px`
    }}>
        <div style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            height: `${param.offset.top}px`,
            width: `${param.position.width}px`,
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            color: 'var(--theme-chart-scale-color)',
            zIndex: 10
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                height: '100%',
                width: '100%'
            }}>
                <select 
                    value={indicatorName}
                    onChange={(e) => {
                        setIndicatorName(e.target.value);
                    }}
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--theme-chart-scale-color)',
                        border: '1px solid',
                        borderColor: 'var(--theme-chart-border-color)',
                        borderRadius: '4px',
                        paddingLeft: '0.1rem',
                        fontSize: '0.7rem',
                        outline: 'none',
                        width: 'fit-content',
                        height: '80%'
                    }}>
                    {MAIN_CHART_INDICATOR_OPTIONS.map(option => (
                        <option key={option} value={option} style={{
                            backgroundColor: 'var(--theme-chart-bg-color)',
                            color: 'var(--theme-chart-scale-color)'
                        }}>
                            {t(`indicators.${option}`)}
                        </option>
                    ))}
                </select>
                <div style={{
                    fontSize: '0.8rem'
                }}>
                    {aimPos && aimPos.y > offset.top && indicatorValueDesc.map((desc, index) => (
                        <span key={`indicator-value-desc-${index}`} style={indicator.param[index] && indicator.param[index].style ? {color: indicator.param[index].style.color} : {}}>
                            {desc}: {indicatorValueText[index]};
                        </span>
                    ))}
                </div>
            </div>
        </div>
        <svg width={param.position.width} height={param.position.height - param.offset.top} 
            style={{
                userSelect: 'none',
                position: 'relative',
                left: 0,
                top: `${param.offset.top}px`,
                backgroundColor: 'transparent'
            }} >
            {xScale}
            {yScale}
            {chart}
            {aim}
        </svg>
    </div>;
});