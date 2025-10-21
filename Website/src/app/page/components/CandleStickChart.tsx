import { useState, useEffect, useRef, useCallback, useMemo, ReactElement, PointerEventHandler, WheelEventHandler, memo } from "react";
import { useTranslation } from "react-i18next";

export interface CandleStickChartData {
    fields: string[],
    data: Array<Array<string|number>>
}

interface ContentInterface {
    $w: number,
    $h: number,
    $data: CandleStickChartData
};

const validateChartData = (data: Array<Array<string|number>>, displayRange: {begin: number, end: number}, dataIndex: {time: number, open: number, close: number, high: number, low: number}) => {
    if (!data || data.length === 0) return false;
    if (displayRange.begin < 0 || displayRange.end < 0) return false;
    if (displayRange.begin >= data.length || displayRange.end >= data.length) return false;
    if (displayRange.begin > displayRange.end) return false;
    if (dataIndex.high === -1 || dataIndex.low === -1) return false;
    if (!data[displayRange.begin] || !data[displayRange.begin][dataIndex.high]) return false;
    return true;
};

const CHART_HEIGHT_RATIO = 0.8;
const CHART_TOP_OFFSET = 30;
const AIM_INFO_FIELDS = ['time','open', 'close', 'high', 'low', 'volume', 'amount', 'open_interest'];

const Content = memo(function ContentImpl(param: ContentInterface) {
    const { t } = useTranslation('explore');
    const yScaleCount = 4;
    const [displayRange, setDisplayRange] = useState({begin: 0, end: 0});
    const data = param.$data.data;
    const w = param.$w;
    const h = param.$h;

    useEffect(() => {
        if (param.$data.data.length > 0) {
            const newRange = {
                begin: param.$data.data.length > 100? param.$data.data.length - 50 : 0, 
                end: param.$data.data.length - 1 
            };
            setDisplayRange(newRange);
        } else {
            setDisplayRange({begin: 0, end: 0});
        }
    }, [param.$data.data.length]);

    // Derive indexes of each kind of data
    const dataIndex = useMemo(() => {
        const ret = {
            time: -1,
            open: -1,
            close: -1,
            high: -1,
            low: -1,
            volume: -1,
            amount: -1,
            open_interest: -1
        };
        param.$data.fields.forEach((v: string, i: number) => { 
            switch(v) {
            case 'datetime':
                ret.time = i;
                break;
            case 'open':
                ret.open = i;
                break;
            case 'close':
                ret.close = i;
                break;
            case 'high': 
                ret.high = i;
                break;
            case 'low':
                ret.low = i;
                break;
            case 'volume':
                ret.volume = i;
                break;
            case 'money':
                ret.amount = i;
                break;
            case 'open_interest':
                ret.open_interest = i;
                break;
            }
        });
        return ret;
    }, [param.$data.fields]); 

    // Calculation of important properties
    const chart = useMemo(() => {
        if (!validateChartData(data, displayRange, dataIndex)) {
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

        let high = data[displayRange.begin][dataIndex.high] as number;
        let low = high;
        const yScaleValue: Array<number> = [];
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (!data[i]) continue; // Only check data existence
            
            const highVal = data[i][dataIndex.high] as number;
            const lowVal = data[i][dataIndex.low] as number;
            
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
    }, [dataIndex, yScaleCount, h, data, displayRange]);
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

        if (!validateChartData(data, displayRange, dataIndex))
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
            if (!data[k]) continue; // Only check data existence
            
            const x = offsetX + width * i;
            const height = unitY * ((data[k][dataIndex.open] as number) - (data[k][dataIndex.close] as number));
            const bodyY = CHART_TOP_OFFSET + unitY * (chart.data.high - ((height > 0? data[k][dataIndex.open]: data[k][dataIndex.close]) as number));
            const wickY1 = CHART_TOP_OFFSET + unitY * (chart.data.high - (data[k][dataIndex.high] as number));
            const wickY2 = CHART_TOP_OFFSET + unitY * (chart.data.high - (data[k][dataIndex.low] as number));
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

            if (i % sample == 0 && data[k] && dataIndex.time !== -1) {
                let text = '?';
                if ((data[k][dataIndex.time] as string).match(/\d+-\d\d-\d\d\s\d\d:\d\d:\d\d/) !== null) {
                    text = (data[k][dataIndex.time] as string).split(' ', 2)[1].replace(/:\d\d$/, '');
                }
                ret.push(<text key={`scale-x-${i}-t`} x={x-5} y={labelY} fill={'var(--theme-chart-scale-color)'} fontSize={chart.fontSize-3}>
                    {text}
                </text>);
            }
        }
        return ret;
    }, [data, w, h, chart.data.high, chart.data.low, chart.fontSize, dataIndex, displayRange, offsetX]);

    const SVGRef = useRef<SVGSVGElement>(null);
    const [displayAim, setDisplayAim] = useState(false);
    const [aimPos, setAimPos] = useState({x: 0, y: 0});
    const [dragging, setDragging] = useState(false);
    const [oldPos, setOldPos] = useState({x: 0, y: 0});

    const aim = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!displayAim)
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
            (data[stickIndex][dataIndex.time] as string).replace(/:\d\d$/, ''), 
            data[stickIndex][dataIndex.open] as number, 
            data[stickIndex][dataIndex.close] as number, 
            data[stickIndex][dataIndex.high] as number, 
            data[stickIndex][dataIndex.low] as number, 
            data[stickIndex][dataIndex.volume] as number, 
            data[stickIndex][dataIndex.amount] as number, 
            data[stickIndex][dataIndex.open_interest] as number];
        for(let i = 0; i < 8; i++) {
          ret.push(<text key={`aim-info-text-${i}`} x={infoX + 5} y={CHART_TOP_OFFSET - 5 + i * chart.fontSize * 1.2} fontSize={chart.fontSize} fill="var(--theme-chart-scale-color)">{`${t(`data_fields.${AIM_INFO_FIELDS[i]}`)}: ${info[i]}`}</text>);
        }   
        return ret;
    }, [displayAim, aimPos.x, aimPos.y, w, h, offsetX, displayRange.begin, displayRange.end, chart.fontSize, chart.data.high, chart.data.low, data, dataIndex, t]);

    const clickTimer = useRef<NodeJS.Timeout>(null);
    const movingDebounceTimer = useRef<NodeJS.Timeout>(null);

    const onPointerDown: PointerEventHandler<SVGSVGElement> = useCallback((e) => {
        if (SVGRef.current === null)
            return;
        const rect = SVGRef.current.getBoundingClientRect();
        setOldPos({x: e.clientX - rect.x, y: e.clientY - rect.y})
        clickTimer.current = setTimeout(() => {
            setDragging(true);
            clickTimer.current = null;
        }, 200);
    }, []);

    const onPointerUp: PointerEventHandler<SVGSVGElement> = useCallback((e) => {
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

    const onPointerMove: PointerEventHandler<SVGSVGElement> = useCallback((e) => {
        if (movingDebounceTimer.current)
            return;
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
            requestAnimationFrame(() => {
                let delta = (x - oldPos.x) / ((w - offsetX) / (displayRange.end - displayRange.begin + 1));
                delta *= 1.0; // sensitivity
                if (delta < 0) delta = Math.floor(delta);
                else delta = Math.ceil(delta);
                let newBegin = displayRange.begin - delta;
                let newEnd = displayRange.end - delta;
                if (newBegin < 0) {
                    newEnd = displayRange.end - displayRange.begin;
                    newBegin = 0;
                } else if (newEnd >= data.length) {
                    newBegin = displayRange.begin + (data.length - 1 - displayRange.end);
                    newEnd = data.length - 1;
                }
                if (newBegin <= newEnd && newBegin >= 0 && newEnd < data.length) {
                    setDisplayRange({begin: newBegin, end: newEnd});
                }
                setOldPos({x: x, y: y});
            });
        }
        movingDebounceTimer.current = setTimeout(() => {
            movingDebounceTimer.current = null;
        }, 20);
    }, [displayAim, dragging, oldPos.x, displayRange.begin, displayRange.end, offsetX, w, h, data.length]); 

    const onPointerOut = useCallback(() => {
        if (dragging)
            setDragging(false);
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

    const onWheel: WheelEventHandler<SVGSVGElement> = useCallback((e) => {
        if (SVGRef.current === null)
            return;
        e.preventDefault();
        const delta = -e.deltaY * 0.1;
        const rect = SVGRef.current.getBoundingClientRect();
        requestAnimationFrame(() => {
            zoom(delta, e.clientX - rect.x);
        });
    }, [zoom]);

    return <div>
        <div style={{
            position: 'relative',
            height: `${CHART_TOP_OFFSET}px`,
            width: '100%',
            backgroundColor: 'blue'
        }}></div>
        <svg ref={SVGRef} width={w} height={h*0.85+50} 
            style={{
                userSelect: 'none',
                position: 'relative',
                left: 0,
                top: 0,
                backgroundColor: 'transparent'
            }} 
            onPointerDown={onPointerDown} 
            onPointerMove={onPointerMove} 
            onPointerUp={onPointerUp} 
            onPointerOut={onPointerOut} onPointerCancel={onPointerOut}
            onWheel={onWheel}>
            {xScale}
            {yScale}
            {sticks}
            {aim}
        </svg>
    </div>;
});

const Container = memo(function ContainerImpl({ data }: { data: CandleStickChartData }) {
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

export default function CandleStickChart({ data }: { data: CandleStickChartData }) {
    return <Container data={data}></Container>;
}