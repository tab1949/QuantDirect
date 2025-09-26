'use client';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

const Chart = memo(function Chart({$dark, $data, $width, $height, $redRise=true, $displayRange={begin: 0, end: $data.date.length - 1, limit: $data.date.length - 1}, $aim={display: false, x: 0, y: 0}}) {
    // Memoize expensive calculations
    const chartData = useMemo(() => {
        const displayCount = $displayRange.end - $displayRange.begin + 1;
        const scaleSpace = (850 / (displayCount <= 5? displayCount: 20));
        const scaleSpaceSecondary = scaleSpace / 5;
        const scaleMarkCount = (displayCount <= 5? displayCount: 20);
        const dateSample = (displayCount <= 5? 1: Math.round(displayCount/5));
        const stickSpace = 850 / displayCount;
        
        // Calculate high/low values efficiently
        let high = $data.high[$displayRange.begin];
        let low = high;
        for (let i = $displayRange.begin; i <= $displayRange.end; ++i) {
            if ($data.high[i] > high) high = $data.high[i];
            if ($data.low[i] < low) low = $data.low[i];
        }
        
        const range = high - low;
        const valueScale = (range > 0 ? 
            [high, low+range/3*2, low+range/3, low]:
            [high, high, high, high]);
            
        return {
            displayCount,
            scaleSpace,
            scaleSpaceSecondary,
            scaleMarkCount,
            dateSample,
            stickSpace,
            high,
            low,
            range,
            valueScale
        };
    }, [$data.high, $data.low, $displayRange]);
    
    const colors = useMemo(() => ({
        markColor: ($dark? '#d8d8d8': '#4c4c4c'),
        riseColor: ($redRise? 'red': 'green'),
        fallColor: ($redRise? 'green': 'red')
    }), [$dark, $redRise]);
    
    // Memoize aim elements
    const aimElements = useMemo(() => {
        if (!$aim.display) return [];
        
        const { stickSpace, high, low } = chartData;
        const { markColor } = colors;
        
        let aimX = $aim.x / $width * 1000;
        let aimY = $aim.y / $height * 1000;
        aimX += (aimX <= 150? 150: 0);
        aimX = 150 + stickSpace * Math.floor((aimX - 150) / stickSpace);
        
        const elements = [
            <line key="aim-vertical" x1={aimX} x2={aimX} y1={0} y2={1000} stroke={markColor} strokeWidth={1}/>,
            <line key="aim-horizontal" x1={0} x2={1000} y1={aimY} y2={aimY} stroke={markColor} strokeWidth={1}/>
        ];
        
        if (aimY <= 900) {
            elements.push(
                <rect key="aim-rect" x={0} y={aimY-25} width={110} height={50} fill={$dark? '#242424': '#dedede'} stroke={markColor} strokeWidth={2}/>,
                <text key="aim-text" x={2} y={aimY+10} fill={markColor} fontSize={30}>{(high-(high-low)*aimY/900).toFixed(2)}</text>
            );
        }
        
        return elements;
    }, [$aim, $width, $height, $dark, chartData, colors]);
    // Memoize scale marks
    const scaleMarks = useMemo(() => {
        const { scaleMarkCount, scaleSpace, scaleSpaceSecondary } = chartData;
        const { markColor } = colors;
        
        return Array.from({ length: scaleMarkCount }, (_, i) => {
            const xpos = i * scaleSpace + 150;
            return (
                <g key={`scale-${i}`}>
                    <line key={`scale-line-${i}`} x1={xpos} x2={xpos} y1={900} y2={950} stroke={markColor} strokeWidth={'3px'}/>
                    <line key={`scale-sub1-${i}`} x1={xpos+scaleSpaceSecondary} x2={xpos+scaleSpaceSecondary} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
                    <line key={`scale-sub2-${i}`} x1={xpos+scaleSpaceSecondary*2} x2={xpos+scaleSpaceSecondary*2} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>  
                    <line key={`scale-sub3-${i}`} x1={xpos+scaleSpaceSecondary*3} x2={xpos+scaleSpaceSecondary*3} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
                    <line key={`scale-sub4-${i}`} x1={xpos+scaleSpaceSecondary*4} x2={xpos+scaleSpaceSecondary*4} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
                </g>
            );
        });
    }, [chartData, colors]);
    
    // Memoize date marks
    const dateMarks = useMemo(() => {
        const { dateSample, stickSpace } = chartData;
        const { markColor } = colors;
        
        const marks = [];
        for (let i = 0, j = $displayRange.begin; j <= $displayRange.end; ++i, ++j) {
            if (i % dateSample === 0) {
                marks.push(
                    <text key={`date-${j}`} x={150+i*stickSpace} y={980} fill={markColor} fontSize={'25px'}>
                        {$data.date[j]}
                    </text>
                );
            }
        }
        return marks;
    }, [chartData, colors, $displayRange, $data.date]);
    // Memoize candle sticks - most expensive operation
    const sticks = useMemo(() => {
        const { stickSpace, range, high } = chartData;
        const { riseColor, fallColor, markColor } = colors;
        const yUnit = range > 0 ? 800/range : 0;
        
        const candleSticks = [];
        for (let i = 0, j = $displayRange.begin; j <= $displayRange.end; ++i, ++j) {
            const x = 150 + i * stickSpace;
            
            if ($data.open[j] > $data.close[j]) {
                const bodyHeight = yUnit > 0 ? yUnit*(Math.abs($data.open[j]-$data.close[j])+0.1) : 1;
                const wickY1 = yUnit > 0 ? 50+yUnit*(high-$data.low[j]) : 400;
                const wickY2 = yUnit > 0 ? 50+yUnit*(high-$data.high[j]) : 400;
                const bodyY = yUnit > 0 ? 50+yUnit*(high-$data.open[j]) : 400;
                
                candleSticks.push(
                    <g key={`candle-${j}`}>
                        <rect key={`candle-body-${j}`}
                            x={x-0.3*stickSpace} y={bodyY}
                            width={stickSpace*0.6} height={bodyHeight}
                            fill={fallColor}/>
                        <line key={`candle-wick-${j}`}
                            x1={x} y1={wickY1}
                            x2={x} y2={wickY2}
                            stroke={fallColor} strokeWidth={4}/>
                    </g>
                );
            }
            else if ($data.open[j] < $data.close[j]) {
                const bodyHeight = yUnit > 0 ? yUnit*(Math.abs($data.open[j]-$data.close[j])+0.1) : 1;
                const wickY1 = yUnit > 0 ? 50+yUnit*(high-$data.low[j]) : 400;
                const wickY2 = yUnit > 0 ? 50+yUnit*(high-$data.high[j]) : 400;
                const bodyY = yUnit > 0 ? 50+yUnit*(high-$data.close[j]) : 400;
                
                candleSticks.push(
                    <g key={`candle-${j}`}>
                        <rect key={`candle-body-${j}`}
                            x={x-0.3*stickSpace} y={bodyY}
                            width={stickSpace*0.6} height={bodyHeight}
                            fill={riseColor}/>
                        <line key={`candle-wick-${j}`}
                            x1={x} y1={wickY1}
                            x2={x} y2={wickY2}
                            stroke={riseColor} strokeWidth={4}/>
                    </g>
                );
            }
            else {
                const dojiY = yUnit > 0 ? 50+yUnit*(high-$data.close[j]) : 400;
                const wickY1 = yUnit > 0 ? 50+yUnit*(high-$data.low[j]) : 400;
                const wickY2 = yUnit > 0 ? 50+yUnit*(high-$data.high[j]) : 400;
                
                candleSticks.push(
                    <g key={`candle-${j}`}>
                        <line key={`candle-doji-${j}`}
                            x1={x-0.3*stickSpace} y1={dojiY}
                            x2={x+0.3*stickSpace} y2={dojiY}
                            stroke={markColor} strokeWidth={4}/>
                        <line key={`candle-wick-${j}`}
                            x1={x} y1={wickY1}
                            x2={x} y2={wickY2}
                            stroke={markColor} strokeWidth={4}/>
                    </g>
                );
            }
        }
        return candleSticks;
    }, [chartData, colors, $displayRange, $data.open, $data.close, $data.high, $data.low]);

    return (<svg width={1000} height={1000}
        style={{
            userSelect: 'none',
            position: 'relative',
            display: 'flex',
            left: 0,
            top: 0,
            backgroundColor: $dark? '#111111': '#f4f4f4',
            transformOrigin: '0 0',
            transform: `scale(${$width/1000}, ${$height/1000})`}}>
        {scaleMarks}
        {dateMarks}
        {chartData.valueScale.map((v, index) => {
            const y = 50+index*267;
            return <g key={`value-line-${index}`}>
                <line key={`value-line-${index}`} x1={3} y1={y} x2={990} y2={y} stroke={'#808080'} strokeWidth={1} strokeDasharray={'5 5'}></line>
                <text key={`value-text-${index}`} x={3} y={y} fill={'#808080'} fontSize={30}>{v.toFixed(2)}</text>
            </g>
        })}
        {sticks}
        {aimElements}
    </svg>);
});

const ControlArea = memo(function ControlArea({$width, $height, $displayRange, $setDisplayRange, $setAim}) {
    const longPressTimer = useRef(null);
    const debounceTimer = useRef(null);
    const wheelTimer = useRef(null);
    const elementRef = useRef(null);
    const latestPosRef = useRef({x: 0, y: 0});
    const [isPressed, setIsPressed] = useState(false);
    const [isLongPress, setIsLongPress] = useState(false);
    const [isChangingRange, setIsChangingRange] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});

    // Memoize callbacks to prevent unnecessary re-renders
    const mouseDown = useCallback((e) => {
        setIsPressed(true);
        const rect = elementRef.current.getBoundingClientRect();
        const pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        latestPosRef.current = pos;
        setPosition(pos);
        $setAim({display: false, x: 0, y: 0});
        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true);
            $setAim({display: true, x: pos.x, y: pos.y});
        }, 400);
    }, [$setAim]);
    
    const mouseMove = useCallback((e) => {
        if (!isPressed) return;
        if (debounceTimer.current) return;
        
        debounceTimer.current = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            const currentPos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            const xMove = currentPos.x - latestPosRef.current.x;
            
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            
            if (!isLongPress) {
                setIsChangingRange(true);
                const range = $displayRange.end - $displayRange.begin;
                const stickWidth = range > 0 ? 850 / range / 10 : Infinity;
                
                if (Math.abs(xMove) >= stickWidth && isFinite(stickWidth)) {
                    const moveCount = Math.floor(Math.abs(xMove) / stickWidth);
                    if (xMove > 0) {
                        $setDisplayRange(dr => ({
                            begin: Math.max(0, dr.begin - moveCount),
                            end: Math.max(0, dr.end - moveCount),
                            limit: dr.limit
                        }));
                    } else {
                        $setDisplayRange(dr => ({
                            begin: Math.min(dr.limit - (dr.end - dr.begin), dr.begin + moveCount),
                            end: Math.min(dr.limit, dr.end + moveCount),
                            limit: dr.limit
                        }));
                    }
                }
                $setAim({display: false, x: 0, y: 0});
            } else {
                setIsChangingRange(false);
                $setAim({
                    display: true,
                    x: currentPos.x,
                    y: currentPos.y
                });
            }
            
            setPosition(currentPos);
            latestPosRef.current = currentPos;
            setTimeout(() => { debounceTimer.current = null; }, 0);
        }, 20);
    }, [isPressed, isLongPress, $displayRange, $setDisplayRange, $setAim]);
    
    const mouseUp = useCallback((e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setIsPressed(false);
        setIsLongPress(false);
        setIsChangingRange(false);
    }, []);
    
    const changeScale = useCallback((e) => {
        setIsPressed(false);
        e.preventDefault();
        
        if (wheelTimer.current) return;

        wheelTimer.current = setTimeout(() => {
            $setDisplayRange(dr => {
                const span = dr.end - dr.begin;
                if (e.deltaY < 0 && span < dr.limit) {
                    let leftVar = Math.ceil(-e.deltaY / 50);
                    let newBegin = Math.max(0, dr.begin - leftVar);
                    let newEnd = Math.min(dr.limit, dr.end + (dr.begin - newBegin));
                    return { begin: newBegin, end: newEnd, limit: dr.limit };
                } else if (e.deltaY > 0 && span > 0) {
                    let leftVar = Math.round(e.deltaY / 50);
                    let newBegin = Math.min(dr.end, dr.begin + leftVar);
                    return { begin: newBegin, end: dr.end, limit: dr.limit };
                }
                return dr;
            });
            clearTimeout(wheelTimer.current);
            wheelTimer.current = null;
        }, 20);
    }, [$setDisplayRange]);
    
    return <div style={{
        color: 'white',
        textAlign: 'end',
        userSelect: 'none',
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${$width}px`,
        height: `${$height}px`
    }} ref={elementRef}
    onMouseDown={mouseDown}
    onMouseMove={mouseMove}
    onMouseUp={mouseUp} onMouseOut={mouseUp} onMouseLeave={mouseUp}
    onWheel={changeScale}></div>
});

export default function CandleStickChart({$dark, $width = 1000, $height = 1000, $data}) { 
    // Memoize initial state calculation
    const initialState = useMemo(() => {
        const len = $data.date.length;
        const end = Math.max(0, len - 1);
        const begin = Math.max(0, end - 6);
        return {begin, end, limit: end};
    }, [$data.date.length]);
    
    const [displayRange, setDisplayRange] = useState(initialState);
    const [aim, setAim] = useState({display: false, x: 0, y: 0});
    
    // Memoize container styles
    const containerStyle = useMemo(() => ({
        backgroundColor: $dark? '#111111': '#f4f4f4',
        width: $width + 20,
        height: $height + 20,
        padding: '10px',
        borderRadius: '10px'
    }), [$dark, $width, $height]);
    
    return (
        <div style={containerStyle}>
            <Chart $dark={$dark} $data={$data} $width={$width} $height={$height} $displayRange={displayRange} $aim={aim}/>
            <ControlArea $width={$width} $height={$height} $displayRange={displayRange} $setDisplayRange={setDisplayRange} $setAim={setAim}/>
        </div>
    );
}