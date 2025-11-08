import { useState, useEffect, useRef, useCallback, useMemo, ReactElement, PointerEventHandler, WheelEventHandler, memo } from "react";
import { useTranslation } from "react-i18next";

import { StaticMarketData, CandleStickChartData, PERIOD_OPTIONS, INDICATOR_OPTIONS, Indicator, IndicatorDisplay } from '../calculate/MarketData';
import * as Indicators from "../calculate/Indicators";
interface ContentInterface {
    $w: number,
    $h: number,
    $data: StaticMarketData
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

const CHART_HEIGHT_RATIO = 0.8;
const CHART_TOP_OFFSET = 30;
const AIM_INFO_FIELDS = ['time','open', 'close', 'high', 'low', 'volume', 'amount', 'open_interest'];

const Content = memo(function ContentImpl(param: ContentInterface) {
    const { t } = useTranslation('explore');
    const yScaleCount = 4;
    const [displayRange, setDisplayRange] = useState({begin: 0, end: 0});
    const [period, setPeriod] = useState('1day');
    const [indicatorName, setIndicatorName] = useState('MA');
    const [indicatorValueText, setIndicatorValueText] = useState<string[]>([]);
    const [indicatorValueDesc, setIndicatorValueDesc] = useState<string[]>([]);
    const data = useMemo<CandleStickChartData>(() => param.$data.getData(period) as CandleStickChartData, [param.$data, period]);
    const chartW = param.$w;
    const [headH, chartH, bottomH] = useMemo(() => [CHART_TOP_OFFSET, param.$h * CHART_HEIGHT_RATIO, param.$h * (1 - CHART_HEIGHT_RATIO) - CHART_TOP_OFFSET], [param.$h]);

    useEffect(() => {
        if (data.length() > 0) {
            const newRange = {
                begin: data.length() > 100? data.length() - 50 : 0, 
                end: data.length() - 1 
            };
            setDisplayRange(newRange);
        } else {
            setDisplayRange({begin: 0, end: 0});
        }
    }, [data]);

    const indicator = useMemo<Indicator>(() => {
        return Indicators.GetIndicatorByName(indicatorName) as Indicator;
    }, [indicatorName]); 

    // Calculation of important properties
    const p = useMemo(() => {
        if (!validateChartData(data, displayRange)) {
            return {
                range: displayRange,
                fontSize: chartH / 25 < 16 ? chartH / 25 : 16,
                scales: {
                    y: {
                        count: yScaleCount,
                        space: chartH / (yScaleCount - 1),
                        value: [0, 0, 0, 0] 
                    }
                },
                data: {
                    max_length: 1,
                    high: 0,
                    low: 0
                }
            };
        }

        let high = data.data[displayRange.begin].high;
        let low = high;
        const yScaleValue: Array<number> = [];
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (!data.data[i].high || !data.data[i].low) continue; // Only check data existence

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
            range: displayRange,
            fontSize: chartH / 25 < 16? chartH / 25: 16,
            scales: {
                y: {
                    count: yScaleCount,
                    space: chartH / (yScaleCount - 1),
                    value: yScaleValue
                }, 
                x: {
                    
                }
            },
            data: {
                max_length: high.toFixed().toString().length,
                high: high,
                low: low
            }
        }
    }, [yScaleCount, chartH, data, displayRange, indicator.data]);
    const offsetX = p.data.max_length * p.fontSize + 10;

    const yScale = useMemo(() => {
        const ret: ReactElement[] = [];
        for (let i = 0; i < p.scales.y.count; ++i) {
            const y = i * p.scales.y.space;
            ret.push(<line key={`scale-y-line-${i}`} x1={10} x2={chartW-10} y1={y} y2={y}  stroke={'#808080'} strokeWidth={0.8} strokeDasharray={'5 5'}/>)
            ret.push(<text key={`scale-y-text-${i}`} x={10} y={y + p.fontSize} fill={'#808080'} fontSize={p.fontSize}>
                {p.scales.y.value[i].toFixed(2)}
            </text>);
        }
        return ret;
    }, [chartW, p.scales.y.count, p.scales.y.space, p.scales.y.value, p.fontSize]); 
    
    const xScale = useMemo(() => {
        const ret: ReactElement[] = [];
        const displayCount = displayRange.end - displayRange.begin + 1;
        const space = (chartW - offsetX) / (displayCount <= 5? displayCount: 20);
        const space2nd = space / 5;
        const scaleCount = (displayCount <= 5? displayCount: 20);
        const y = chartH + bottomH * 0.2;
        const mainTickLength = Math.min(20, bottomH * 0.5);
        const subTickLength = Math.min(10, bottomH * 0.3);
        for (let i = 0, k = displayRange.begin; i < scaleCount; ++i, ++k) {
            const x = i * space + offsetX;
            ret.push(<line key={`scale-x-${i}-0`} x1={x} x2={x} y1={y} y2={y + mainTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'2px'}/>);
            ret.push(<line key={`scale-x-${i}-1`} x1={x+space2nd} x2={x+space2nd} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-2`} x1={x+space2nd*2} x2={x+space2nd*2} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-3`} x1={x+space2nd*3} x2={x+space2nd*3} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-4`} x1={x+space2nd*4} x2={x+space2nd*4} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        }
        return ret;
    }, [chartW, chartH, bottomH, displayRange.begin, displayRange.end, offsetX]); 

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
        
        const displayCount = displayRange.end - displayRange.begin + 1;
        const dataRange = p.data.high - p.data.low;
        const unitY = (dataRange > 0? chartH / dataRange: 0);
        const width = (chartW - offsetX) / displayCount;
        const bodyWidth = displayCount >= 50 ? width * 0.2 : width * 0.5;
        const sample = (displayCount <= 5? 1: Math.round(displayCount/10));
        const labelY = chartH + bottomH*0.2 + 20 + p.fontSize;

        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            if (!data.data[k].high || !data.data[k].low || !data.data[k].open || !data.data[k].close) continue; // Only check data existence
            
            const x = offsetX + width * i;
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

            if (i % sample == 0 && data.data[k].time) {
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
        
        const indicatorData: string[] = [];
        for (let i = 0; i < indicator.param.length; ++i) {
            indicatorData.push('');
        }            
        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            const x = offsetX + width * i;
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
    }, [data, chartW, chartH, bottomH, p.data.high, p.data.low, p.fontSize, displayRange, offsetX, indicator.data, indicator.param]);

    const RootDivRef = useRef<HTMLDivElement>(null);
    const [displayAim, setDisplayAim] = useState(false);
    const [aimPos, setAimPos] = useState({x: 0, y: 0});
    const [dragging, setDragging] = useState(false);
    const [oldPos, setOldPos] = useState({x: 0, y: 0});
    const animationFrameRef = useRef<number | null>(null);

    const aim = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!displayAim || !p.data.high || !p.data.low)
            return ret;
        const stickWidth = (chartW - offsetX) / (displayRange.end - displayRange.begin + 1);
        let index = Math.round((aimPos.x - offsetX) / stickWidth);
        const x = offsetX + stickWidth * index;
        const value = p.data.high - (p.data.high - p.data.low) * (aimPos.y / chartH);
        ret.push(<line key="aim-v" x1={x} x2={x} y1={0} y2={chartH} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        ret.push(<line key="aim-h" x1={offsetX-5} x2={chartW} y1={aimPos.y} y2={aimPos.y} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        ret.push(<rect key="aim-indicator" x={5} y={aimPos.y-p.fontSize/2-2} height={p.fontSize+4} width={offsetX-5} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
        ret.push(<text key="aim-indicator-text" x={7} y={aimPos.y+p.fontSize/2-2} fill={'var(--theme-chart-scale-color)'} fontSize={p.fontSize}>{value.toFixed(2).toString()}</text>);
        let infoX = offsetX;
        const infoWidth = p.fontSize * 11;
        if (x < (chartW + offsetX) / 2) // offsetX + (w - offsetX) / 2 = (w + offsetX) / 2
            infoX = chartW - infoWidth;
        ret.push(<rect key="aim-info" x={infoX} y={0} width={infoWidth} height={p.fontSize*10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
        index += displayRange.begin;
        if (index < 0) index = 0;
        else if (index >= data.length()) index = data.length() - 1;
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
    }, [displayAim, aimPos.x, aimPos.y, chartW, chartH, offsetX, displayRange.begin, displayRange.end, p.fontSize, p.data.high, p.data.low, data, t]);

    useEffect(() => {
        const stickWidth = (chartW - offsetX) / (displayRange.end - displayRange.begin + 1);
        const index = Math.round((aimPos.x - offsetX) / stickWidth) + displayRange.begin;
        const iv: string[] = [];
        for (let i = 0; i < indicator.param.length; ++i)
            if (indicator.data[i][index])
                iv.push(`${indicator.data[i][index] == -1? '--': indicator.data[i][index].toFixed(2)}`);
        setIndicatorValueText(iv);
    }, [aimPos.x, displayRange, indicator.param.length, indicator.data, offsetX, chartW]);

    const clickTimer = useRef<NodeJS.Timeout>(null);

    const onPointerDown: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (RootDivRef.current === null)
            return;
        const {x: rectX, y: rectY} = RootDivRef.current.getBoundingClientRect();
        const clientX = e.clientX - rectX;
        const clientY = e.clientY - rectY;
        const chartBottom = headH + chartH;
        if (clientX < offsetX || clientY < headH || clientY > chartBottom) {
            return;
        }
        setOldPos({x: clientX, y: clientY - headH});
        setDragging(true);
        clickTimer.current = setTimeout(() => {
            clickTimer.current = null;
        }, 200);
    }, [offsetX, chartH, headH]); 

    const onPointerUp: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        setDragging(false);
        if (clickTimer.current === null) {
            return;
        } 
        clearTimeout(clickTimer.current);
        if (RootDivRef.current === null)
            return;
        const rect = RootDivRef.current.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        const chartBottom = headH + chartH;
        if (x < offsetX || y < headH || y > chartBottom) {
            setDisplayAim(false);
            return;
        }
        let clampedX = x;
        let clampedY = y - headH;
        if (clampedX < offsetX) clampedX = offsetX;
        if (clampedY < 0) clampedY = 0;
        else if (clampedY > chartH) clampedY = chartH;
        setAimPos({x: clampedX, y: clampedY});
        const newDisplayAim = !displayAim;
        setDisplayAim(newDisplayAim);
        if (!newDisplayAim)
            return;
    }, [displayAim, headH, chartH, offsetX]); 

    const xDelta = useRef(0);
    const left = useRef(false);

    const onPointerMove: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (RootDivRef.current === null)
            return;
        const rect = RootDivRef.current.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y - headH;
        if (displayAim) {
            if (x < offsetX) x = offsetX;
            if (y < 0) y = 0;
            else if (y > chartH) y = chartH;
            requestAnimationFrame(() => {
                setAimPos({x: x, y: y});
            });
        }
        else if (dragging) {
            const displayCount = displayRange.end - displayRange.begin + 1;
            if (displayCount == data.length())
                return;
            if (left.current) { // before: left
                if (x > oldPos.x) { // now: right
                    left.current = false;
                    xDelta.current = 0;
                }
            }
            else { // before: right
                if (x < oldPos.x) {// now: left
                    left .current = true;
                    xDelta.current = 0;
                }
            }
            xDelta.current += x - oldPos.x;
            const pixelPerDataPoint = (chartW - offsetX) / displayCount;
            
            let delta = xDelta.current / pixelPerDataPoint;
            setOldPos({x: x, y: y});

            if (-1 < delta && delta < 1)
                return;
            delta = Math.round(delta);
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            animationFrameRef.current = requestAnimationFrame(() => {
                
                let newBegin = displayRange.begin - delta;
                let newEnd = displayRange.end - delta;
                
                if (newBegin < 0) {
                    newBegin = 0;
                    newEnd = displayCount - 1;
                } else if (newEnd >= data.length()) {
                    newEnd = data.length() - 1;
                    newBegin = data.length() - displayCount - 1;
                }
                setDisplayRange({begin: newBegin, end: newEnd});
                
                xDelta.current = 0;
                animationFrameRef.current = null;
            });
        }
    }, [displayAim, dragging, oldPos.x, displayRange.begin, displayRange.end, offsetX, chartW, chartH, headH, data, xDelta]); 

    const onPointerLeave = useCallback(() => {
        if (dragging)
            setDragging(false);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, [dragging]);

    const zoom = useCallback((delta: number, x: number) => {
        if (displayRange.end < displayRange.begin || data.length() === 0) return;
        const oldLength = displayRange.end - displayRange.begin + 1;
        if (oldLength <= 0) return;
        const relativePos = Math.max(0, Math.min(1, (x - offsetX) / (chartW - offsetX)));
        const newLength = Math.max(1, Math.round(oldLength * Math.exp(-delta * 0.01)));
        const totalLength = data.length();
        if (newLength >= totalLength) {
            setDisplayRange({begin: 0, end: totalLength - 1});
            return;
        }
        const oldMouseIndex = displayRange.begin + relativePos * (oldLength - 1);
        let new_begin = Math.round(oldMouseIndex - relativePos * (newLength - 1));
        let new_end = new_begin + newLength - 1;
        
        if (new_begin < 0) {
            new_begin = 0;
            new_end = Math.min(totalLength - 1, new_begin + newLength - 1);
        }
        if (new_end > totalLength - 1) {
            new_end = totalLength - 1;
            new_begin = Math.max(0, new_end - newLength + 1);
        }
        if (new_begin > new_end) {
            const clamped_index = Math.max(0, Math.min(totalLength - 1, Math.round(oldMouseIndex)));
            new_begin = clamped_index;
            new_end = clamped_index;
        }
        setDisplayRange({begin: new_begin, end: new_end});
    }, [displayRange.begin, displayRange.end, offsetX, chartW, data]);

    const onWheel: WheelEventHandler<HTMLDivElement> = useCallback((e) => {
        if (RootDivRef.current === null)
            return;
        const rect = RootDivRef.current.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        const chartBottom = headH + chartH;
        if (x < offsetX || y < headH || y > chartBottom) {
            return;
        }
        // e.preventDefault();
        const delta = -e.deltaY * 0.1;
        requestAnimationFrame(() => {
            zoom(delta, x);
        });
    }, [zoom, offsetX, chartH, headH]);

    return <div ref={RootDivRef}
    onPointerDown={onPointerDown} 
    onPointerMove={onPointerMove} 
    onPointerUp={onPointerUp} 
    onPointerLeave={onPointerLeave} onPointerCancel={onPointerLeave}
    onWheel={onWheel}>
        <div style={{
            position: 'relative',
            height: `${headH}px`,
            width: '100%',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            color: 'var(--theme-chart-scale-color)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
            }}>
                <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--theme-chart-scale-color)',
                        margin: '0',
                        border: '1px solid',
                        borderColor: 'var(--theme-chart-border-color)',
                        borderRadius: '4px',
                        paddingLeft: '0.1rem',
                        fontSize: '0.7rem',
                        outline: 'none',
                        width: 'fit-content',
                        height: '100%'
                    }}>
                    {PERIOD_OPTIONS.map(option => (
                        <option key={option} value={option} style={{
                            backgroundColor: 'var(--theme-chart-bg-color)',
                            color: 'var(--theme-chart-scale-color)'
                        }}>
                            {t(`periods.${option}`)}
                        </option>
                    ))}
                </select>
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
                        height: '100%'
                    }}>
                    {INDICATOR_OPTIONS.map(option => (
                        <option key={option} value={option} style={{
                            backgroundColor: 'var(--theme-chart-bg-color)',
                            color: 'var(--theme-chart-scale-color)'
                        }}>
                            {option}
                        </option>
                    ))}
                </select>
                <div style={{
                    fontSize: `${p.fontSize}px`
                }}>
                    {displayAim && indicatorValueDesc.map((desc, index) => (
                        <span key={`indicator-value-desc-${index}`} style={{color: indicator.param[index].style.color}}>
                            {desc}: {indicatorValueText[index]};
                        </span>
                    ))}
                </div>
            </div>
            
            <div style={{
                flex: 1
            }}></div>
        </div>
        <svg width={chartW} height={chartH + bottomH} 
            style={{
                userSelect: 'none',
                position: 'relative',
                left: 0,
                top: 0,
                backgroundColor: 'transparent'
            }} >
            {xScale}
            {yScale}
            {chart}
            {aim}
        </svg>
    </div>;
});

const Container = memo(function ContainerImpl({ data }: { data: StaticMarketData }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({w: 0, h: 0});

    // Initialization
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const {width, height} = containerRef.current.getBoundingClientRect();
                setDimensions({w: width, h: height});
            }
        };

        updateDimensions();

        window.addEventListener('resize', updateDimensions);

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current)
            resizeObserver.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            resizeObserver.disconnect();
        };
    }, []);

    return <div ref={containerRef} style={{
        position: 'relative',
        left: '0px',
        top: '0px',
        width: '100%',
        height: '100%',
        border: '0px',
        borderRadius: '5px',
        backgroundColor: 'var(--theme-chart-bg-color)'
    }}>
        <Content $w={dimensions.w} $h={dimensions.h} $data={data}/>
    </div>;
});

export default function CandleStickChart({ data }: { data: {fields: string[], data: Array<Array<string|number>>} }) {
    const marketData = useMemo(() => new StaticMarketData(data), [data]);
    return <Container data={marketData}></Container>;
}