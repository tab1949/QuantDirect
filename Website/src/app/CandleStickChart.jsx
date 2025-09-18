'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";

function Chart ({$dark, $data, $width, $height, $redRise=true, $displayRange={begin: 0, end: $data.date.length - 1, limit: $data.date.length - 1}}) {
    const displayCount = $displayRange.end - $displayRange.begin + 1;
    const scaleSpace = (850 / (displayCount <= 5? displayCount: 20));
    const scaleSpaceSecondary = scaleSpace / 5;
    const scaleMarkCount = (displayCount <= 5? displayCount: 20);
    let   scaleMarks = [];
    const dateSample = (displayCount <= 5? 1: Math.round(displayCount/5));
    let   dateMarks = [];
    const stickSpace = 850 / displayCount;
    let   sticks = [];
    const markColor = ($dark? '#d8d8d8': '#4c4c4c');
    const riseColor = ($redRise? 'red': 'green');
    const fallColor = ($redRise? 'green': 'red'); 
    let keyCounter = 0;
    let high = $data.high[$displayRange.begin];
    let low = high;
    for (let i = $displayRange.begin; i <= $displayRange.end; ++i)
        if ($data.high[i] > high)
            high = $data.high[i];
    for (let i = $displayRange.begin; i <= $displayRange.end; ++i)
        if ($data.low[i] < low)
            low = $data.low[i];
    const valueScale = (high > low ? 
        [high, low+(high-low)/3*2, low+(high-low)/3, low]:
        [high, high, high, high]);

    for (let i = 0; i < scaleMarkCount; ++i) {
        let xpos = i * scaleSpace + 150;
        scaleMarks.push((<g key={keyCounter++}>
            <line key={keyCounter++} x1={xpos} x2={xpos} y1={900} y2={950} stroke={markColor} strokeWidth={'3px'}/>
            <line key={keyCounter++} x1={xpos+scaleSpaceSecondary} x2={xpos+scaleSpaceSecondary} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
            <line key={keyCounter++} x1={xpos+scaleSpaceSecondary*2} x2={xpos+scaleSpaceSecondary*2} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>  
            <line key={keyCounter++} x1={xpos+scaleSpaceSecondary*3} x2={xpos+scaleSpaceSecondary*3} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
            <line key={keyCounter++} x1={xpos+scaleSpaceSecondary*4} x2={xpos+scaleSpaceSecondary*4} y1={900} y2={920} stroke={markColor} strokeWidth={'1px'}/>
        </g>));
    }
    for (let i = 0, j = $displayRange.begin; j <= $displayRange.end; ++i, ++j) {
        if (i % dateSample == 0)
            dateMarks.push(<text key={keyCounter++} x={i*stickSpace+120} y={980} fill={markColor} fontSize={'25px'}>{$data.date[j]}</text>);
    }
    for (let i = 0, j = $displayRange.begin; j <= $displayRange.end; ++i, ++j) {
        const x = 150+i*stickSpace;
        const yUnit = 800/(high-low);
        if ($data.open[j] > $data.close[j]) {
            sticks.push(<g key={keyCounter++}>
                <rect key={keyCounter++}
                x={x-0.3*stickSpace} y={50+yUnit*(high-$data.open[j])}
                width={stickSpace*0.6} height={yUnit*(Math.abs($data.open[j]-$data.close[j])+0.1)}
                fill={fallColor}/>
                <line key={keyCounter++}
                x1={x} y1={50+yUnit*(high-$data.low[j])}
                x2={x} y2={50+yUnit*(high-$data.high[j])}
                stroke={fallColor} strokeWidth={'3px'}/>
            </g>);
        }
        else if ($data.open[j] < $data.close[j]) {
            sticks.push(<g key={keyCounter++}>
                <rect key={keyCounter++}
                x={x-0.3*stickSpace} y={50+yUnit*(high-$data.close[j])}
                width={stickSpace*0.6} height={yUnit*(Math.abs($data.open[j]-$data.close[j])+0.1)}
                fill={riseColor}/>
                <line key={keyCounter++}
                x1={x} y1={50+yUnit*(high-$data.low[j])}
                x2={x} y2={50+yUnit*(high-$data.high[j])}
                stroke={riseColor} strokeWidth={'3px'}/>
            </g>);
        }
        else {
            sticks.push(<g key={keyCounter++}>
                <line key={keyCounter++}
                x1={x-0.3*stickSpace} y1={50+yUnit*(high-$data.close[j])}
                x2={x+0.3*stickSpace} y2={50+yUnit*(high-$data.close[j])}
                stroke={markColor} strokeWidth={'3px'}/>
                <line key={keyCounter++}
                x1={x} y1={50+yUnit*(high-$data.low[j])}
                x2={x} y2={50+yUnit*(high-$data.high[j])}
                stroke={markColor} strokeWidth={'3px'}/>
            </g>)
        }
    }

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
        {scaleMarks.map((v, i) => {return v;})}
        {dateMarks.map((v, i) => {return v;})}
        {valueScale.map((v, index) => {
            const y = 50+index*267;
            return <g key={keyCounter++}>
                <line key={keyCounter++} x1={3} y1={y} x2={990} y2={y} stroke={'#808080'} strokeWidth={1} strokeDasharray={'5 5'}></line>
                <text key={keyCounter++} x={3} y={y} fill={'#808080'} fontSize={30}>{v.toFixed(2)}</text>
            </g>
        })}
        {sticks.map((v, i) => {return v})}
    </svg>);
}

function ControlArea({$width, $height, $displayRange, $setDisplayRange}) {
    const longPressTimer = useRef(null);
    const debounceTimer = useRef(null);
    const wheelTimer = useRef(null);
    const elementRef = useRef(null);
    const [isPressed, setIsPressed] = useState(false);
    const [isLongPress, setIsLongPress] = useState(false);
    const [isChangingRange, setIsChangingRange] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});

    const mouseDown = useCallback((e) => {
        setIsPressed(true);
        const rect = elementRef.current.getBoundingClientRect();
        setPosition({x: e.clientX - rect.left, y: e.clientY - rect.top});
        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true);
        }, 500);
    }, []);
    const mouseMove = useCallback((e) => {
        if (!isPressed) return;
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            const currentPos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            const xMove = currentPos.x - position.x;
            const yMove = currentPos.y - position.y;
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            if (!isLongPress) {
                setIsChangingRange(true);
                const stickWidth = 850 / ($displayRange.end - $displayRange.begin) / 5;
                if (Math.abs(xMove) >= stickWidth) {
                    if (xMove > 0) { // Left dragging
                        if ($displayRange.begin > 0) {
                            let actualMoveCount = Math.floor(Math.abs(xMove) / stickWidth);
                            actualMoveCount = (actualMoveCount < $displayRange.begin? actualMoveCount: $displayRange.begin);
                            $setDisplayRange({
                                begin: $displayRange.begin - actualMoveCount, 
                                end: $displayRange.end - actualMoveCount, 
                                limit: $displayRange.limit});
                        }
                    }
                    else if ($displayRange.end < $displayRange.limit) {
                        let actualMoveCount = Math.floor(Math.abs(xMove) / stickWidth);
                        actualMoveCount = (actualMoveCount < ($displayRange.limit - $displayRange.end)? actualMoveCount: ($displayRange.limit - $displayRange.end));
                        $setDisplayRange({
                            begin: $displayRange.begin + actualMoveCount, 
                            end: $displayRange.end + actualMoveCount, 
                            limit: $displayRange.limit});
                    }
                }
            }
            else {
                setIsChangingRange(false);
            }
            setPosition(currentPos);
        }, 5);
    }, [isPressed, isLongPress, debounceTimer]);
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
        
        if (wheelTimer.current) {
            clearTimeout(wheelTimer.current);
            wheelTimer.current = null;
        }
        wheelTimer.current = setTimeout(() => {
            if (e.deltaY < 0) { // Down
                if ($displayRange.end - $displayRange.begin < $displayRange.limit) {
                    let leftVar = Math.ceil(-e.deltaY / 50);
                    if ($displayRange.begin - leftVar < 0) {
                        leftVar = $displayRange.begin;
                    }
                    $setDisplayRange({
                        begin: $displayRange.begin - leftVar,
                        end: $displayRange.end,
                        limit: $displayRange.limit
                    });
                }
            }
            else if (e.deltaY > 0) {
                if ($displayRange.end - $displayRange.begin > 0) {
                    let leftVar = Math.round(e.deltaY / 50);
                    if ($displayRange.begin + leftVar > $displayRange.end) {
                        leftVar = 0;
                    }
                    $setDisplayRange({
                        begin: $displayRange.begin + leftVar,
                        end: $displayRange.end,
                        limit: $displayRange.limit
                    });
                }
            }
        }, 5);
    });
    
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
    onWheel={changeScale}>{isPressed?(isLongPress?'long':'short'):'none'}{isChangingRange?' changing':' '}</div>
}

export default function CandleStickChart({$dark, $width = 1000, $height = 1000}) {
    let data = {
        date: ['01/01', '01/02', '01/03', '01/04', '01/05', '01/08', '01/09', '01/10', '01/11', '01/12', '01/15'],
        open: [900, 990, 980.3, 1110, 1130, 1150, 1143, 1132, 1149, 1166, 1151.4],
        close: [980, 940, 1100, 1110, 1130, 1120, 1142, 1151, 1149, 1164.3, 1130],
        high: [1050.0, 1000.0, 1100.0, 1110.0, 1136.5, 1151, 1143, 1133.3, 1155, 1171, 1155],
        low: [880.0, 932.1, 966.0, 1110.0, 1125.5, 1120, 1142, 1131, 1142.8, 1164, 1130],
    };
    const [displayRange, setDisplayRange] = useState({begin: 0, end: data.date.length - 7, limit: data.date.length - 1});
    return (<div style={{
        backgroundColor: $dark? '#111111': '#f4f4f4',
        width: $width + 20,
        height: $height + 20,
        padding: '10px',
        borderRadius: '10px'}}>
        <Chart $dark={$dark} $data={data} $width={$width} $height={$height} $displayRange={displayRange}/>
        <ControlArea $width={$width} $height={$height} $displayRange={displayRange} $setDisplayRange={setDisplayRange}/>
    </div>);
}