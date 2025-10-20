import { useState, useEffect, useRef, memo, useMemo, ReactElement } from "react";

export interface CandleStickChartData {
    fields: string[],
    data: Array<Array<string|number>>
}

interface ContentInterface {
    $w: number,
    $h: number,
    $data: CandleStickChartData
};

const Content = memo(function ContentImpl(param: ContentInterface) {
    const [yScaleCount, setYScaleCount] = useState(4);
    const data = param.$data.data;
    const w = param.$w;
    const h = param.$h;

    const displayRange = useMemo(() => {
        return {
            begin: param.$data.data.length > 100? param.$data.data.length-49 : 0, 
            end: param.$data.data.length - 1 };
    }, [param.$data.data]);

    // Derive indexes of each kind of data
    const dataIndex = useMemo(() => {
        const ret = {
            time: -1,
            open: -1,
            close: -1,
            high: -1,
            low: -1
        };
        param.$data.fields.map((v: string, i: number) => {
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
            }
        });
        return ret;
    }, [param.$data.fields]);

    // Calculation of important properties
    const chart = useMemo(() => {
        const displayRange = {
            begin: data.length > 100 ? data.length - 50: 0, 
            end: data.length - 1
        };
        // const displayCount = displayRange.end - displayRange.begin + 1;
        
        let high = data[displayRange.begin][dataIndex.high] as number;
        let low = high;
        const yScaleValue: Array<number> = [];
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (data[i][dataIndex.high] as number > high)
                high = data[i][dataIndex.high] as number;
            if (data[i][dataIndex.low] as number < low)
                low = data[i][dataIndex.low] as number;
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
                    space: (h * 0.80) / (yScaleCount - 1),
                    value: yScaleValue
                } 
            },
            data: {
                high: high,
                low: low
            }
        }
    }, [dataIndex, yScaleCount, h, data]);

    const yScale = useMemo(() => {
        const ret: ReactElement[] = [];
        for (let i = 0; i < chart.scales.y.count; ++i) {
            const y = 30 + i * chart.scales.y.space;
            ret.push(<line key={`scale-y-line-${i}`} x1={10} x2={w-10} y1={y} y2={y}  stroke={'#808080'} strokeWidth={0.8} strokeDasharray={'5 5'}/>)
            ret.push(<text key={`scale-y-text-${i}`} x={10} y={y-8} fill={'#808080'} fontSize={chart.fontSize}>
                {chart.scales.y.value[i].toFixed(2)}
            </text>);
        }
        return ret;
    }, [w, chart.scales.y, chart.fontSize]);
    
    const xScale = useMemo(() => {
        const ret: ReactElement[] = [];
        const displayCount = displayRange.end - displayRange.begin + 1;
        const space = (w - chart.fontSize * 8) / (displayCount <= 5? displayCount: 20);
        const space2nd = space / 5;
        const scaleCount = (displayCount <= 5? displayCount: 20);
        const sample = (displayCount <= 5? 1: Math.round(displayCount/20));
        for (let i = 0, k = displayRange.begin; i < scaleCount; ++i, ++k) {
            const x = i * space + chart.fontSize * 6;
            ret.push(<line key={`scale-x-${i}-0`} x1={x} x2={x} y1={h*0.9} y2={h*0.9+20} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'2px'}/>);
            ret.push(<line key={`scale-x-${i}-1`} x1={x+space2nd} x2={x+space2nd} y1={h*0.9} y2={h*0.9+10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-2`} x1={x+space2nd*2} x2={x+space2nd*2} y1={h*0.9} y2={h*0.9+10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-3`} x1={x+space2nd*3} x2={x+space2nd*3} y1={h*0.9} y2={h*0.9+10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            ret.push(<line key={`scale-x-${i}-4`} x1={x+space2nd*4} x2={x+space2nd*4} y1={h*0.9} y2={h*0.9+10} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            if (i % sample == 0 && data[k]) {
                let text = '?';
                if ((data[k][dataIndex.time] as string).match(/\d+-\d\d-\d\d\s\d\d:\d\d:\d\d/) !== null) {
                    text = (data[k][dataIndex.time] as string).split(' ', 2)[1].replace(/:\d\d$/, '');
                }
                ret.push(<text key={`scale-x-${i}-t`} x={x-8} y={h*0.9+40} fill={'var(--theme-chart-scale-color)'} fontSize={16}>
                    {text}
                </text>);
            }
        }
        return ret;
    }, [w, h, data, dataIndex, displayRange, chart.fontSize])

    const sticks = useMemo(() => {
        const ret: ReactElement[] = [];
        const displayCount = displayRange.end - displayRange.begin + 1;
        const dataRange = chart.data.high - chart.data.low;
        const unitY = (dataRange > 0? h*0.8/dataRange: 0);
        const offsetX = chart.fontSize * 6;
        const width = (w - offsetX) / displayCount;
        const bodyWidth = width * 0.5;
        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            const x = offsetX + width * i;
            const height = unitY * ((data[k][dataIndex.open] as number) - (data[k][dataIndex.close] as number));
            const bodyY = 30 + unitY * (chart.data.high - ((height > 0? data[k][dataIndex.open]: data[k][dataIndex.close]) as number));
            const wickY1 = 30 + unitY * (chart.data.high - (data[k][dataIndex.high] as number));
            const wickY2 = 30 + unitY * (chart.data.high - (data[k][dataIndex.low] as number));
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
                    <line key={`candle-${i}-body`} x1={x-bodyWidth/2} x2={x+bodyWidth/2} y1={bodyY} y2={bodyY} stroke="white" strokeWidth={1}/>
                    <line key={`candle-${i}-wick`} x1={x} x2={x} y1={wickY1} y2={wickY2} stroke="white" strokeWidth={1}/>
                </g>);
            }
        }
        return ret;
    }, [data, w, h, chart.data, chart.fontSize, dataIndex, displayRange]);

    return <svg width={w} height={h} style={{
        userSelect: 'none',
        position: 'relative',
        left: 0,
        top: 0,
        backgroundColor: 'transparent'
    }}>
        {xScale}
        {yScale}
        {sticks}
    </svg>;
});

const Container = memo(function ContainerImpl(data: CandleStickChartData) {
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

export default function CandleStickChart(data: CandleStickChartData) {
    return <Container fields={data.fields} data={data.data}></Container>;
}