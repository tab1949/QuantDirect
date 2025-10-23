import { useState, useEffect, useRef, useCallback, useMemo, ReactElement, PointerEventHandler, WheelEventHandler, memo } from "react";
import { useTranslation } from "react-i18next";

import { StaticMarketData, CandleStickChartData, PERIOD_OPTIONS } from '../calculate/MarketData';

interface ContentInterface {
    $w: number,
    $h: number,
    $data: StaticMarketData
};

const validateChartData = (data: CandleStickChartData[], displayRange: {begin: number, end: number}) => {
    if (!data || data.length === 0) return false;
    if (displayRange.begin < 0 || 
        displayRange.end < 0 || 
        displayRange.begin >= data.length || 
        displayRange.end >= data.length ||
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
    const [period, setPeriod] = useState('1min');
    const data = useMemo<CandleStickChartData[]>(() => param.$data.getData(period), [param.$data, period]);
    const w = param.$w;
    const h = param.$h;

    useEffect(() => {
        if (data.length > 0) {
            const newRange = {
                begin: data.length > 100? data.length - 50 : 0, 
                end: data.length - 1 
            };
            setDisplayRange(newRange);
        } else {
            setDisplayRange({begin: 0, end: 0});
        }
    }, [data.length]);

    // Calculation of important properties
    const chart = useMemo(() => {
        if (!validateChartData(data, displayRange)) {
            return {
                range: displayRange,
                fontSize: h / 25 < 16 ? h / 25 : 16,
                scales: {
                    y: {
                        count: yScaleCount,
                        space: (h * CHART_HEIGHT_RATIO) / (yScaleCount - 1),
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

        let high = data[displayRange.begin].high;
        let low = high;
        const yScaleValue: Array<number> = [];
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (!data[i].high || !data[i].low) continue; // Only check data existence

            const highVal = data[i].high;
            const lowVal = data[i].low;
            
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
            fontSize: h / 25 < 16? h / 25: 16,
            scales: {
                y: {
                    count: yScaleCount,
                    space: (h * CHART_HEIGHT_RATIO) / (yScaleCount - 1),
                    value: yScaleValue
                } 
            },
            data: {
                max_length: high.toFixed().toString().length,
                high: high,
                low: low
            }
        }
    }, [yScaleCount, h, data, displayRange]);
    const offsetX = chart.data.max_length * chart.fontSize + 10;

    const yScale = useMemo(() => {
        const ret: ReactElement[] = [];
        for (let i = 0; i < chart.scales.y.count; ++i) {
            const y = CHART_TOP_OFFSET + i * chart.scales.y.space;
            ret.push(<line key={`scale-y-line-${i}`} x1={10} x2={w-10} y1={y} y2={y}  stroke={'#808080'} strokeWidth={0.8} strokeDasharray={'5 5'}/>)
            ret.push(<text key={`scale-y-text-${i}`} x={10} y={y-8} fill={'#808080'} fontSize={chart.fontSize}>
                {chart.scales.y.value[i].toFixed(2)}
            </text>);
        }
        return ret;
    }, [w, chart.scales.y.count, chart.scales.y.space, chart.scales.y.value, chart.fontSize]); 
    
    const xScale = useMemo(() => {
        const ret: ReactElement[] = [];
        const displayCount = displayRange.end - displayRange.begin + 1;
        const space = (w - offsetX) / (displayCount <= 5? displayCount: 20);
        const space2nd = space / 5;
        const scaleCount = (displayCount <= 5? displayCount: 20);
        const y = h * CHART_HEIGHT_RATIO + 35;
        const bottomSpace = h * 0.05 + 15;
        const mainTickLength = Math.min(20, bottomSpace * 0.5);
        const subTickLength = Math.min(10, bottomSpace * 0.3);
        for (let i = 0, k = displayRange.begin; i < scaleCount; ++i, ++k) {
            const x = i * space + offsetX;
            ret.push(<line key={`scale-x-${i}-0`} x1={x} x2={x} y1={y} y2={y + mainTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'2px'}/>);
            ret.push(<line key={`scale-x-${i}-1`} x1={x+space2nd} x2={x+space2nd} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-2`} x1={x+space2nd*2} x2={x+space2nd*2} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-3`} x1={x+space2nd*3} x2={x+space2nd*3} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-4`} x1={x+space2nd*4} x2={x+space2nd*4} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        }
        return ret;
    }, [w, h, displayRange.begin, displayRange.end, offsetX]); 

    const sticks = useMemo(() => {
        const ret: ReactElement[] = [];

        if (!validateChartData(data, displayRange))
            return ret;
        
        const displayCount = displayRange.end - displayRange.begin + 1;
        const dataRange = chart.data.high - chart.data.low;
        const unitY = (dataRange > 0? h * CHART_HEIGHT_RATIO / dataRange: 0);
        const width = (w - offsetX) / displayCount;
        const bodyWidth = width * 0.5;
        const sample = (displayCount <= 5? 1: Math.round(displayCount/10));
        const y = h * CHART_HEIGHT_RATIO + 35;
        const bottomSpace = h * 0.05 + 15;
        const mainTickLength = Math.min(20, bottomSpace * 0.5);
        const labelY = y + mainTickLength + 11;
        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            if (!data[k].high || !data[k].low || !data[k].open || !data[k].close) continue; // Only check data existence
            
            const x = offsetX + width * i;
            const height = unitY * ((data[k].open as number) - (data[k].close as number));
            const bodyY = CHART_TOP_OFFSET + unitY * (chart.data.high - ((height > 0? data[k].open: data[k].close) as number));
            const wickY1 = CHART_TOP_OFFSET + unitY * (chart.data.high - (data[k].high as number));
            const wickY2 = CHART_TOP_OFFSET + unitY * (chart.data.high - (data[k].low as number));
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

            if (i % sample == 0 && data[k].time) {
                const timeStr = data[k].time;
                let text = '?';
                if (timeStr.includes(' ')) {
                    // YYYY-MM-DD HH:mm:SS -> HH:mm
                    const timePart = timeStr.split(' ')[1];
                    text = timePart.replace(/:\d\d$/, ''); 
                } else if (timeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // YYYY-MM-DD -> MM-DD
                    text = timeStr.substring(5); 
                }
                ret.push(<text key={`scale-x-${i}-t`} x={x-5} y={labelY} fill={'var(--theme-chart-scale-color)'} fontSize={chart.fontSize-3}>
                    {text}
                </text>);
            }
        }
        return ret;
    }, [data, w, h, chart.data.high, chart.data.low, chart.fontSize, displayRange, offsetX]);

    const SVGRef = useRef<SVGSVGElement>(null);
    const [displayAim, setDisplayAim] = useState(false);
    const [aimPos, setAimPos] = useState({x: 0, y: 0});
    const [dragging, setDragging] = useState(false);
    const [oldPos, setOldPos] = useState({x: 0, y: 0});
    const animationFrameRef = useRef<number | null>(null);

    const aim = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!displayAim || !chart.data.high || !chart.data.low)
            return ret;
        const stickWidth = (w - offsetX) / (displayRange.end - displayRange.begin + 1);
        let stickIndex = Math.round((aimPos.x - offsetX) / stickWidth);
        const x = offsetX + stickWidth * stickIndex;
        const value = chart.data.high - (chart.data.high - chart.data.low) * ((aimPos.y - CHART_TOP_OFFSET) / (h * CHART_HEIGHT_RATIO));
        ret.push(<line key="aim-x" x1={x} x2={x} y1={CHART_TOP_OFFSET-10} y2={h*0.85+CHART_TOP_OFFSET} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        ret.push(<line key="aim-y" x1={offsetX-5} x2={w} y1={aimPos.y} y2={aimPos.y} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        ret.push(<rect key="aim-indicator" x={5} y={aimPos.y-chart.fontSize/2-2} height={chart.fontSize+4} width={offsetX-5} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
        ret.push(<text key="aim-indicator-text" x={7} y={aimPos.y+chart.fontSize/2-2} fill={'var(--theme-chart-scale-color)'} fontSize={chart.fontSize}>{value.toFixed(2).toString()}</text>);
        let infoX = offsetX;
        const infoWidth = chart.fontSize * 11;
        if (x < (w + offsetX) / 2) // offsetX + (w - offsetX) / 2 = (w + offsetX) / 2
            infoX = w - infoWidth;
        ret.push(<rect key="aim-info" x={infoX} y={CHART_TOP_OFFSET-20} width={infoWidth} height={chart.fontSize*10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'} fill="var(--theme-chart-bg-color)"/>);
        stickIndex += displayRange.begin;
        if (stickIndex < 0) stickIndex = 0;
        else if (stickIndex >= data.length) stickIndex = data.length - 1;
        const info = [
            data[stickIndex].time.replace(/:\d\d$/, ''), 
            data[stickIndex].open, 
            data[stickIndex].close, 
            data[stickIndex].high, 
            data[stickIndex].low, 
            data[stickIndex].volume, 
            data[stickIndex].amount, 
            data[stickIndex].open_interest];
        for(let i = 0; i < 8; i++) {
          ret.push(<text key={`aim-info-text-${i}`} x={infoX + 5} y={CHART_TOP_OFFSET - 5 + i * chart.fontSize * 1.2} fontSize={chart.fontSize} fill="var(--theme-chart-scale-color)">{`${t(`data_fields.${AIM_INFO_FIELDS[i]}`)}: ${info[i]}`}</text>);
        }   
        return ret;
    }, [displayAim, aimPos.x, aimPos.y, w, h, offsetX, displayRange.begin, displayRange.end, chart.fontSize, chart.data.high, chart.data.low, data, t]);

    const clickTimer = useRef<NodeJS.Timeout>(null);

    const onPointerDown: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (SVGRef.current === null)
            return;
        const rect = SVGRef.current.getBoundingClientRect();
        setOldPos({x: e.clientX - rect.x, y: e.clientY - rect.y});
        setDragging(true);
        clickTimer.current = setTimeout(() => {
            clickTimer.current = null;
        }, 200);
    }, []);

    const onPointerUp: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        setDragging(false);
        if (clickTimer.current === null) {
            return;
        } 
        clearTimeout(clickTimer.current);
        setDisplayAim(!displayAim);
        if (!displayAim)
            return;
        if (SVGRef.current === null)
            return;
        const rect = SVGRef.current.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y;
        if (x < offsetX) x = offsetX;
        if (y < CHART_TOP_OFFSET) y = CHART_TOP_OFFSET;
        else if (y - CHART_TOP_OFFSET > h * CHART_HEIGHT_RATIO) y = h * CHART_HEIGHT_RATIO + CHART_TOP_OFFSET;
        setAimPos({x: x, y: y});
    }, [displayAim, h, offsetX]); 

    const onPointerMove: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (SVGRef.current === null)
            return;
        const rect = SVGRef.current.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y;
        if (displayAim) {
            if (x < offsetX) x = offsetX;
            if (y < CHART_TOP_OFFSET) y = CHART_TOP_OFFSET;
            else if (y - CHART_TOP_OFFSET > h * CHART_HEIGHT_RATIO) y = h * CHART_HEIGHT_RATIO + CHART_TOP_OFFSET;
            requestAnimationFrame(() => {
                setAimPos({x: x, y: y});
            });
        }
        else if (dragging) {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            animationFrameRef.current = requestAnimationFrame(() => {
                const pixelDelta = x - oldPos.x;

                const displayCount = displayRange.end - displayRange.begin + 1;
                const pixelPerDataPoint = (w - offsetX) / displayCount;
                
                const delta = pixelDelta / pixelPerDataPoint;
                
                let newBegin = displayRange.begin - delta;
                let newEnd = displayRange.end - delta;
                
                if (newBegin < 0) {
                    const rangeLength = displayRange.end - displayRange.begin;
                    newBegin = 0;
                    newEnd = Math.min(data.length - 1, rangeLength);
                } else if (newEnd >= data.length) {
                    const rangeLength = displayRange.end - displayRange.begin;
                    newEnd = data.length - 1;
                    newBegin = Math.max(0, data.length - 1 - rangeLength);
                }
                
                if (newBegin <= newEnd && newBegin >= 0 && newEnd < data.length) {
                    setDisplayRange({begin: Math.round(newBegin), end: Math.round(newEnd)});
                }
                
                setOldPos({x: x, y: y});
                animationFrameRef.current = null;
            });
        }
    }, [displayAim, dragging, oldPos.x, displayRange.begin, displayRange.end, offsetX, w, h, data.length]); 

    const onPointerOut = useCallback(() => {
        if (dragging)
            setDragging(false);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, [dragging]);

    const zoom = useCallback((delta: number, x: number) => {
        if (displayRange.end < displayRange.begin || data.length === 0) return;
        const oldLength = displayRange.end - displayRange.begin + 1;
        if (oldLength <= 0) return;
        const relativePos = Math.max(0, Math.min(1, (x - offsetX) / (w - offsetX)));
        const newLength = Math.max(1, Math.round(oldLength * Math.exp(-delta * 0.01)));
        const totalLength = data.length;
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
    }, [displayRange.begin, displayRange.end, offsetX, w, data.length]);

    const onWheel: WheelEventHandler<HTMLDivElement> = useCallback((e) => {
        if (SVGRef.current === null)
            return;
        e.preventDefault();
        const delta = -e.deltaY * 0.1;
        const rect = SVGRef.current.getBoundingClientRect();
        requestAnimationFrame(() => {
            zoom(delta, e.clientX - rect.x);
        });
    }, [zoom]);

    return <div 
    onPointerDown={onPointerDown} 
    onPointerMove={onPointerMove} 
    onPointerUp={onPointerUp} 
    onPointerOut={onPointerOut} onPointerCancel={onPointerOut}
    onWheel={onWheel}>
        <div style={{
            position: 'relative',
            height: `${CHART_TOP_OFFSET}px`,
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
                        border: '1px solid',
                        borderColor: 'var(--theme-chart-border-color)',
                        borderRadius: '4px',
                        paddingLeft: '0.1rem',
                        fontSize: '0.7rem',
                        outline: 'none',
                        width: 'fit-content',
                        height: '1.5rem'
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
            </div>
            
            <div style={{
                flex: 1
            }}></div>
        </div>
        <svg ref={SVGRef} width={w} height={h*0.85+50} 
            style={{
                userSelect: 'none',
                position: 'relative',
                left: 0,
                top: 0,
                backgroundColor: 'transparent'
            }} >
            {xScale}
            {yScale}
            {sticks}
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