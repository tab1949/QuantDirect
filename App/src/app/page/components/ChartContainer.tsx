import { useState, useEffect, useRef, useCallback, useMemo, PointerEventHandler, WheelEventHandler, memo } from "react";
import { useTranslation } from "react-i18next";

import { StaticMarketData, PERIOD_OPTIONS } from '../utils/MarketData';
import { CandleStickChart, CandleStickChartContentInterface } from "./CandleStickChart";
import { BarChart, BarChartContentInterface } from "./BarChart";

interface ChartData {
    fields: string[];
    data: Array<Array<number|string>>;
};

interface ContainerComponent {
    description?: string;
    type: 'CandleStickChart' | 'BarChart';
    position?: {
        group?: number;
        left?: number;
        top?: number;
        width?: number;
        height?: number;
    }
};

interface ContainerInterface {
    $data: ChartData;
    $layout: 'single' | 'vertical' | 'horizontal' | 'free';
    $primary?: number;
    $components: ContainerComponent[];
};

const offset = {
    top: 25,
    left: 80,
    right: 0,
    bottom: 60
}

export const ChartContainer = memo(function ChartContainerImpl(param: ContainerInterface) {
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

    const [displayRange, setDisplayRange] = useState({begin: 0, end: 0});
    const [duration, setDuration] = useState('1day');
    const [displayAim, setDisplayAim] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [aimPos, setAimPos] = useState({x: 0, y: 0});
    const [dragging, setDragging] = useState(false);
    const [oldPos, setOldPos] = useState({x: 0, y: 0});
    const animationFrameRef = useRef<number | null>(null);
    const clickTimer = useRef<NodeJS.Timeout>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const displayCount = useMemo(() => {
        return displayRange.end - displayRange.begin + 1;
    }, [displayRange.begin, displayRange.end]);
    
    const rawData = useMemo(() => {
        return new StaticMarketData(param.$data);
    }, [param.$data]);

    const data = useMemo(() => {
        return rawData.getData(duration);
    }, [duration, rawData]);

    const [dataLength, max, min] = useMemo(() => {
        let max = 0;
        let min = 0;
        if (data.length() > 0 && displayRange.begin >= 0 && displayRange.end < data.length() && displayRange.begin <= displayRange.end) {
            max = data.data[displayRange.begin].high;
            min = max;
            for (let i = displayRange.begin; i <= displayRange.end; ++i) {
                if (data.data[i].high !== undefined && data.data[i].low !== undefined) {
                    if (data.data[i].high > max) max = data.data[i].high;
                    if (data.data[i].low < min) min = data.data[i].low;
                }
            }
        }
        return [data.length(), max, min];
    }, [data, displayRange]);

    useEffect(() => {
        if (dataLength > 0) {
            const newRange = {
                begin: dataLength > 100? dataLength - 50 : 0, 
                end: dataLength - 1 
            };
            setDisplayRange(newRange);
        } else {
            setDisplayRange({begin: 0, end: 0});
        }
    }, [dataLength]);

    const onPointerDown: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (containerRef.current === null)
            return;
        const {x: rectX, y: rectY} = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX - rectX;
        const clientY = e.clientY - rectY;
        if (clientX < offset.left || clientX > dimensions.w - offset.right || clientY < offset.top || clientY > dimensions.h - offset.bottom) {
            return;
        }
        setOldPos({x: clientX, y: clientY});
        setDragging(true);
        clickTimer.current = setTimeout(() => {
            clickTimer.current = null;
        }, 200);
    }, [dimensions]); 

    const onPointerUp: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        setDragging(false);
        if (clickTimer.current === null) {
            return;
        } 
        clearTimeout(clickTimer.current);
        if (containerRef.current === null)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        if (x < offset.left || x > dimensions.w - offset.right || y < offset.top || y > dimensions.h - offset.bottom) {
            setDisplayAim(false);
            return;
        }
        setAimPos({x: x - offset.left, y: y - offset.top});
        setDisplayAim(!displayAim);
    }, [displayAim, dimensions]); 

    const xDelta = useRef(0);
    const left = useRef(false);

    const onPointerMove: PointerEventHandler<HTMLDivElement> = useCallback((e) => {
        if (containerRef.current === null)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        let x = e.clientX - rect.x;
        let y = e.clientY - rect.y;
        if (displayAim) {
            if (x < offset.left) 
                x = offset.left;
            else if (x > dimensions.w - offset.right) 
                x = dimensions.w - offset.right;
            if (y < offset.top) 
                y = offset.top;
            else if (y > dimensions.h - offset.bottom) 
                y = dimensions.h - offset.bottom;
            requestAnimationFrame(() => {
                setAimPos({x: x - offset.left, y: y - offset.top});
            });
        }
        else if (dragging) {
            if (displayCount == dataLength)
                return;
            if (left.current) { // before: left
                if (x > oldPos.x) { // now: right
                    left.current = false;
                    xDelta.current = 0;
                }
            }
            else { // before: right
                if (x < oldPos.x) {// now: left
                    left.current = true;
                    xDelta.current = 0;
                }
            }
            xDelta.current += x - oldPos.x;
            const pixelPerDataPoint = (dimensions.w - offset.left) / displayCount;
            
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
                } else if (newEnd >= dataLength) {
                    newEnd = dataLength - 1;
                    newBegin = Math.max(0, dataLength - displayCount);
                }
                setDisplayRange({begin: newBegin, end: newEnd});
                
                xDelta.current = 0;
                animationFrameRef.current = null;
            });
        }
    }, [dimensions, displayAim, dragging, oldPos.x, displayRange.begin, displayRange.end, displayCount, dataLength]); 

    const onPointerLeave = useCallback(() => {
        if (dragging)
            setDragging(false);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, [dragging]);

    const zoom = useCallback((delta: number, x: number) => {
        if (displayRange.end < displayRange.begin || dataLength === 0)
            return;
        const oldLength = displayCount;
        if (oldLength <= 0) 
            return;
        const relativePos = Math.max(0, Math.min(1, (x - offset.left) / (dimensions.w - offset.left)));
        const newLength = Math.max(1, Math.round(oldLength * Math.exp(-delta * 0.01)));
        if (newLength >= dataLength) {
            setDisplayRange({begin: 0, end: dataLength - 1});
            return;
        }
        const oldMouseIndex = displayRange.begin + relativePos * (oldLength - 1);
        let new_begin = Math.round(oldMouseIndex - relativePos * (newLength - 1));
        let new_end = new_begin + newLength - 1;
        
        if (new_begin < 0) {
            new_begin = 0;
            new_end = Math.min(dataLength - 1, new_begin + newLength - 1);
        }
        if (new_end > dataLength - 1) {
            new_end = dataLength - 1;
            new_begin = Math.max(0, new_end - newLength + 1);
        }
        if (new_begin > new_end) {
            const clamped_index = Math.max(0, Math.min(dataLength - 1, Math.round(oldMouseIndex)));
            new_begin = clamped_index;
            new_end = clamped_index;
        }
        setDisplayRange({begin: new_begin, end: new_end});
    }, [displayRange.begin, displayRange.end, displayCount, dimensions.w, dataLength]);

    const onWheel: WheelEventHandler<HTMLDivElement> = useCallback((e) => {
        if (containerRef.current === null)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.x;
        const y = e.clientY - rect.y;
        if (x < offset.left || x > dimensions.w - offset.right || y < offset.top || y > dimensions.h - offset.bottom) {
            return;
        }
        // e.preventDefault();
        const delta = -e.deltaY * 0.1;
        requestAnimationFrame(() => {
            zoom(delta, x);
        });
    }, [zoom, dimensions]);

    const { t } = useTranslation('explore');

    const components = useMemo(() => {
        const chartH = dimensions.h - offset.top - offset.bottom;
        const fontSize = chartH / 25 < 16 ? chartH / 25 : 16;
        const primaryIndex = param.$primary !== undefined ? param.$primary : 0;
        
        switch (param.$layout) {
        case 'single':
            if (param.$components.length !== 1)
                throw "Chart Combination with layout 'single' can only have one component.";
            switch(param.$components[0].type) {
            case 'CandleStickChart':
                const props: CandleStickChartContentInterface = {
                    data: {
                        data: data,
                        max: max,
                        min: min
                    },
                    displayRange: displayRange,
                    fontSize: fontSize,
                    position: {
                        left: 0,
                        top: 0,
                        width: dimensions.w,
                        height: dimensions.h - offset.top
                    },
                    offset: offset,
                    aim: displayAim? aimPos: undefined
                };
                return <CandleStickChart param={props}/>
            }
            break;
        case 'vertical': {
            const totalHeight = dimensions.h - offset.top - offset.bottom;
            
            const componentHeights: number[] = [];
            let specifiedHeightSum = 0;
            let unspecifiedCount = 0;
            
            param.$components.forEach((comp) => {
                if (comp.position?.height !== undefined) {
                    const height = totalHeight * comp.position.height;
                    componentHeights.push(height);
                    specifiedHeightSum += height;
                } else {
                    componentHeights.push(0);
                    unspecifiedCount++;
                }
            });
            
            const remainingHeight = Math.max(0, totalHeight - specifiedHeightSum);
            const avgHeight = unspecifiedCount > 0 ? remainingHeight / unspecifiedCount : 0;
            
            componentHeights.forEach((height, idx) => {
                if (height === 0) {
                    componentHeights[idx] = avgHeight;
                }
            });
            
            return param.$components.map(
                (val: ContainerComponent, index: number) => {
                    const componentHeight = componentHeights[index];
                    const isPrimary = index === primaryIndex;
                    const componentAim = displayAim ? (isPrimary ? aimPos : { x: aimPos.x, y: 0 }) : undefined;
                    
                    switch(val.type) {
                    case 'CandleStickChart': {
                        const componentProps: CandleStickChartContentInterface = {
                            data: {
                                data: data,
                                max: max,
                                min: min
                            },
                            displayRange: displayRange,
                            fontSize: fontSize,
                            position: {
                                top: 0,
                                height: componentHeight + (index == 0 ? offset.bottom : 0),
                                left: 0,
                                width: dimensions.w
                            },
                            offset: {
                                ...offset,
                                bottom: index == 0 ? offset.bottom : 20
                            },
                            aim: componentAim
                        };
                        
                        return <CandleStickChart key={index} param={componentProps}/>;
                    }
                    case 'BarChart': {
                        const timeLabels: string[] = [];
                        
                        if (data.length() > 0) {
                            for (let i = 0; i < data.length(); ++i) {
                                timeLabels.push(data.data[i].time || '');
                            }
                        }
                        
                        const componentProps: BarChartContentInterface = {
                            data: rawData,
                            period: duration,
                            timeLabels: timeLabels,
                            displayRange: displayRange,
                            fontSize: fontSize,
                            position: {
                                left: 0,
                                top: 0,
                                width: dimensions.w,
                                height: componentHeight + (index == 0 ? offset.bottom : 0),
                            },
                            offset: {
                                ...offset,
                                bottom: index == 0 ? offset.bottom : 20
                            },
                            aim: componentAim,
                            showXAxis: index == 0
                        };
                        
                        return <BarChart key={index} param={componentProps}/>;
                    }
                    default:
                        return null;
                    }
                }
            );
        }
        case 'horizontal':
            break;
        case 'free':
            break;
        }
        return <></>;
    }, [param, data, max, min, dimensions, displayAim, aimPos, displayRange, duration, rawData]);

    return <div ref={containerRef} 
        onPointerDown={onPointerDown} 
        onPointerMove={onPointerMove} 
        onPointerUp={onPointerUp} 
        onPointerLeave={onPointerLeave} onPointerCancel={onPointerLeave}
        onWheel={onWheel} style={{
        position: 'relative',
        left: '0px',
        top: '0px',
        width: '100%',
        height: '100%',
        border: '0px',
        borderRadius: '5px',
        backgroundColor: 'var(--theme-chart-bg-color)'
    }}>
        <div style={{
            position: 'relative',
            height: `${offset.top}px`,
            width: '100%',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
            color: 'var(--theme-chart-scale-color)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                height: '100%'
            }}>
                <div ref={menuRef} style={{
                    position: 'relative', height: '100%' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--theme-chart-scale-color)',
                            margin: '0',
                            border: '1px solid',
                            borderColor: 'var(--theme-chart-border-color)',
                            borderRadius: '4px',
                            paddingLeft: '0.1rem',
                            paddingRight: '0.5rem',
                            fontSize: '0.7rem',
                            outline: 'none',
                            width: 'fit-content',
                            height: '80%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                        }}
                    >
                        {t(`periods.${duration}`)}
                        <span style={{ fontSize: '0.6rem' }}>{menuOpen ? '>' : '<'}</span>
                    </button>
                    {menuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '100%',
                            height: '80%',
                            marginLeft: '4px',
                            backgroundColor: 'var(--theme-chart-bg-color)',
                            border: '1px solid',
                            borderColor: 'var(--theme-chart-border-color)',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '4px',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}>
                            {PERIOD_OPTIONS.map(option => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setDuration(option);
                                    }}
                                    style={{
                                        backgroundColor: duration === option 
                                            ? '#AAAAAA' 
                                            : 'transparent',
                                        color: 'var(--theme-chart-border-color)',
                                        border: 'none',
                                        borderRadius: '2px',
                                        paddingLeft: '0.5rem',
                                        paddingRight: '0.5rem',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (duration !== option) {
                                            e.currentTarget.style.backgroundColor = '#AAAAAA';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (duration !== option) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    {t(`periods.${option}`)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {components}
    </div>;
});