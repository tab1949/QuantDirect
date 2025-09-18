'use client';
import { useState, useEffect, useRef, useCallback } from "react";

function Chart ({$dark, $data, $width, $height, $redRise=true, $displayRange={begin: 0, end: $data.date.length - 1, limit: $data.date.length - 1}, $aim={display: false, x: 0, y: 0}}) {
    const displayCount = $displayRange.end - $displayRange.begin + 1;
    const scaleSpace = (850 / (displayCount <= 5? displayCount: 20));
    const scaleSpaceSecondary = scaleSpace / 5;
    const scaleMarkCount = (displayCount <= 5? displayCount: 20);
    let   scaleMarks = [];
    const dateSample = (displayCount <= 5? 1: Math.round(displayCount/5));
    let   dateMarks = [];
    const stickSpace = 850 / displayCount;
    let   sticks = [];
    let   aimX = 0, aimY = 0;
    let   aim = [];
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
    
    if ($aim.display) {
        aimX = $aim.x / $width * 1000;
        aimY = $aim.y / $height * 1000;
        aimX += (aimX <= 150? 150: 0);
        aimX = 150 + stickSpace * Math.floor((aimX - 150) / stickSpace);
        aim.push(<line key={keyCounter++} x1={aimX} x2={aimX} y1={0} y2={1000} stroke={markColor} strokeWidth={1}/>);
        aim.push(<line key={keyCounter++} x1={0} x2={1000} y1={aimY} y2={aimY} stroke={markColor} strokeWidth={1}/>);
        if (aimY <= 900) {
            aim.push(<rect key={keyCounter++} x={0} y={aimY-25} width={110} height={50} fill={$dark? '#242424': '#dedede'} stroke={markColor} strokeWidth={2}/>);
            aim.push(<text key={keyCounter++} x={2} y={aimY+10} fill={markColor} fontSize={30}>{(high-(high-low)*aimY/900).toFixed(2)}</text>);
        }
    }
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
                stroke={fallColor} strokeWidth={4}/>
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
                stroke={riseColor} strokeWidth={4}/>
            </g>);
        }
        else {
            sticks.push(<g key={keyCounter++}>
                <line key={keyCounter++}
                x1={x-0.3*stickSpace} y1={50+yUnit*(high-$data.close[j])}
                x2={x+0.3*stickSpace} y2={50+yUnit*(high-$data.close[j])}
                stroke={markColor} strokeWidth={4}/>
                <line key={keyCounter++}
                x1={x} y1={50+yUnit*(high-$data.low[j])}
                x2={x} y2={50+yUnit*(high-$data.high[j])}
                stroke={markColor} strokeWidth={4}/>
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
        {sticks.map((v, i) => {return v;})}
        {aim.map((v, i) => {return v;})}
    </svg>);
}

function ControlArea({$width, $height, $displayRange, $setDisplayRange, $setAim}) {
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
        $setAim({display: false, x: 0, y: 0});
        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true);
            $setAim({display: true, x: position.x, y: position.y});
        }, 400);
    }, []);
    const mouseMove = useCallback((e) => {
        if (!isPressed) return;
        if (debounceTimer.current) return;
        debounceTimer.current = setTimeout(() => {
            const rect = elementRef.current.getBoundingClientRect();
            const currentPos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            const xMove = currentPos.x - position.x;
            const yMove = currentPos.y - position.y;
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            if (!isLongPress) {
                setIsChangingRange(true);
                const stickWidth = 850 / ($displayRange.end - $displayRange.begin) / 10;
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
                $setAim({display: false, x: 0, y: 0});
            }
            else {
                setIsChangingRange(false);
                $setAim({
                    display: true,
                    x: currentPos.x,
                    y: currentPos.y
                });
            }
            setPosition(currentPos);
            const temp = debounceTimer;
            debounceTimer.current = null;
            clearTimeout(temp.current);
        }, 20);
    }, [position, isPressed, isLongPress, debounceTimer]);
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
            if (e.deltaY < 0) { // Up
                if ($displayRange.end - $displayRange.begin < $displayRange.limit) {
                    let leftVar = Math.ceil(-e.deltaY / 50);
                    let rightVar = 0;
                    if ($displayRange.begin - leftVar < 0) {
                        rightVar += leftVar - ($displayRange.begin + 1);
                        if ($displayRange.end + rightVar > $displayRange.limit)
                                rightVar = $displayRange.limit - $displayRange.end;
                        leftVar = $displayRange.begin;
                    }
                    $setDisplayRange({
                        begin: $displayRange.begin - leftVar,
                        end: $displayRange.end + rightVar,
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
            const temp = wheelTimer;
            wheelTimer.current = null;
            clearTimeout(temp.current);
        }, 20);
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
    onWheel={changeScale}></div>
}

export default function CandleStickChart({$dark, $width = 1000, $height = 1000, $data}) { 
    const [displayRange, setDisplayRange] = useState({begin: 0, end: $data.date.length - 7, limit: $data.date.length - 1});
    const [aim, setAim] = useState({display: false, x: 0, y: 0});
    return (<div style={{
        backgroundColor: $dark? '#111111': '#f4f4f4',
        width: $width + 20,
        height: $height + 20,
        padding: '10px',
        borderRadius: '10px'}}>
        <Chart $dark={$dark} $data={$data} $width={$width} $height={$height} $displayRange={displayRange} $aim={aim}/>
        <ControlArea $width={$width} $height={$height} $displayRange={displayRange} $setDisplayRange={setDisplayRange} $setAim={setAim}/>
    </div>);
}