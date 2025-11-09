import { useMemo, ReactElement, memo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StaticMarketData, SUB_CHART_INDICATOR_OPTIONS } from '../calculate/MarketData';
import { GetIndicatorByName } from '../calculate/Indicators';

export interface BarChartContentInterface {
    data: StaticMarketData;
    period: string;
    timeLabels?: string[];
    color?: string[];
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

const validateChartData = (data: number[], displayRange: {begin: number, end: number}) => {
    if (!data || data.length === 0) return false;
    if (displayRange.begin < 0 || 
        displayRange.end < 0 || 
        displayRange.begin >= data.length || 
        displayRange.end >= data.length ||
        displayRange.begin > displayRange.end) 
        return false;
    return true;
};

export const BarChart = memo(function ContentImpl({ param }: {param: BarChartContentInterface}) {
    const { t } = useTranslation('basic');
    const [value, setValue] = useState<number>(0);
    const [selectedIndicator, setSelectedIndicator] = useState<string>(
        SUB_CHART_INDICATOR_OPTIONS.length > 0 ? SUB_CHART_INDICATOR_OPTIONS[0] : ''
    );
    const offset = param.offset;
    const displayRange = param.displayRange;
    const yScaleCount = 3;
    const showXAxis = (param.showXAxis !== undefined ? param.showXAxis : false);
    const timeLabels = useMemo(() => param.timeLabels || [], [param.timeLabels]);
    const colors = param.color;
    const defaultColor = "var(--theme-chart-scale-color)";
    const svgW = useMemo(() => param.position.width - offset.left - (offset.right || 0), [param.position.width, offset.left, offset.right]);
    const svgH = useMemo(() => param.position.height - offset.top - offset.bottom, [param.position.height, offset.top, offset.bottom]);
    const bottomH = offset.bottom;
    const displayCount = displayRange.end - displayRange.begin + 1;
    
    const data = useMemo(() => {
        if (!selectedIndicator || SUB_CHART_INDICATOR_OPTIONS.length === 0) return [];
        const data = param.data.getData(param.period);
        const indicator = GetIndicatorByName(selectedIndicator);
        if (!indicator) return [];
        indicator.updateData(data);
        if (indicator.data.length > 0) {
            return indicator.data[0];
        }
        return [];
    }, [param.data, param.period, selectedIndicator]);
    
    useEffect(() => {
        if (SUB_CHART_INDICATOR_OPTIONS.length > 0) {
            if (!SUB_CHART_INDICATOR_OPTIONS.includes(selectedIndicator)) {
                setSelectedIndicator(SUB_CHART_INDICATOR_OPTIONS[0]);
            }
        }
    }, [selectedIndicator]);
    

    // Calculation of important properties
    const p = useMemo(() => {
        if (!validateChartData(data, displayRange)) {
            return {
                fontSize: param.fontSize,
                scales: {
                    y: {
                        count: yScaleCount,
                        space: yScaleCount > 1 ? svgH / (yScaleCount - 1) : 0,
                        value: [0, 0, 0] 
                    }
                },
                max: 0,
            };
        }
        let high: number = 0;
        
        for (let i = displayRange.begin; i <= displayRange.end; ++i) {
            if (data[i] === undefined || data[i] === null) continue;
            if (data[i] > high) high = data[i];
        }
        
        const yScaleValue: Array<number> = [];
        const yScaleRange = high;
        if (yScaleRange > 0) {
            for (let i = 0; i < yScaleCount; ++i) {
                yScaleValue.push(high - yScaleRange / (yScaleCount - 1) * i);
            }
        } else {
            for (let i = 0; i < yScaleCount; ++i) {
                yScaleValue.push(high);
            }
        }

        return {
            fontSize: param.fontSize,
            scales: {
                y: {
                    count: yScaleCount,
                    space: yScaleCount > 1 ? svgH / (yScaleCount - 1) : 0,
                    value: yScaleValue
                }
            },
            max: high,
        }
    }, [yScaleCount, svgH, data, displayRange, param.fontSize]);

    const yScale = useMemo(() => {
        const ret: ReactElement[] = [];
        const unitName = p.max >= 100000000? '亿' : p.max >= 10000? '万': '';
        const unitValue = p.max >= 100000000? 100000000 : p.max >= 10000? 10000: 1;

        for (let i = 0; i < p.scales.y.count; ++i) {
            const y = i * p.scales.y.space;
            const labelText = `${(p.scales.y.value[i] / unitValue).toFixed(2)}${unitName}`;
            ret.push(<line key={`scale-y-line-${i}`} x1={0} x2={svgW + offset.left} y1={y} y2={y}  stroke={'#808080'} strokeWidth={0.8} strokeDasharray={'5 5'}/>)
            ret.push(<text key={`scale-y-text-${i}`} x={5} y={y + p.fontSize} fill={'#808080'} fontSize={p.fontSize}>
                {labelText}
            </text>);
        }
        return ret;
    }, [svgW, offset.left, p]); 
    
    const xScale = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!showXAxis) {
            return ret;
        }
        const scaleCount = displayCount <= 5 ? displayCount : 20;
        const space = svgW / scaleCount;
        const space2nd = space / 5;
        const y = svgH + bottomH * 0.2;
        const mainTickLength = Math.min(20, bottomH * 0.5);
        const subTickLength = Math.min(10, bottomH * 0.3);
        for (let i = 0, k = displayRange.begin; i < scaleCount; ++i, ++k) {
            const x = i * space + offset.left;
            ret.push(<line key={`scale-x-${i}-0`} x1={x} x2={x} y1={y} y2={y + mainTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'2px'}/>);
            for (let j = 1; j <= 4; ++j) {
                ret.push(<line key={`scale-x-${i}-${j}`} x1={x + space2nd * j} x2={x + space2nd * j} y1={y} y2={y + subTickLength} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
            }
        }
        return ret;
    }, [showXAxis, displayCount, svgW, svgH, bottomH, displayRange.begin, offset.left]);

    const chart = useMemo(() => {
        const ret: ReactElement[] = [];

        if (!validateChartData(data, displayRange))
            return ret;
        
        const unitY = (p.max > 0? svgH / p.max: 0);
        const width = svgW / displayCount;
        const barWidth = displayCount >= 50 ? width * 0.1 : width * 0.2;
        const sample = (displayCount <= 5? 1: Math.round(displayCount/10));
        const labelY = svgH + offset.bottom * 0.2 + 20 + p.fontSize;

        for (let i = 0, k = displayRange.begin; i < displayCount; ++i, ++ k) {
            if (data[k] === undefined || data[k] === null) continue; // Only check data existence
            
            const x = offset.left + width * i;
            const value = data[k];
            const barHeight = unitY * value;
            const barY = svgH - barHeight;

            const barColor = (colors && colors[k] !== undefined) ? colors[k] : defaultColor;
            const barX = x - barWidth / 2;

            ret.push(<rect 
                key={`bar-${i}`} 
                x={barX} 
                y={barY} 
                width={barWidth} 
                height={barHeight} 
                fill={barColor} 
                stroke={barColor} 
                strokeWidth={1}
            />);

            if (showXAxis && i % sample === 0 && timeLabels[k]) {
                const timeStr = timeLabels[k];
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
        
        return ret;
    }, [data, timeLabels, colors, defaultColor, svgW, svgH, offset.left, offset.bottom, p, displayRange, displayCount, showXAxis]);

    const aimPos = param.aim;

    useEffect(() => {
        if (!aimPos || !data || data.length === 0) {
            setValue(0);
            return;
        }
        const stickWidth = svgW / displayCount;
        let index = Math.round(aimPos.x / stickWidth);
        if (index < 0) 
            index = 0;
        else if (index >= displayCount) 
            index = displayCount - 1;
        
        const dataIndex = index + displayRange.begin;
        if (dataIndex >= 0 && dataIndex < data.length && data[dataIndex] !== undefined && data[dataIndex] !== null) {
            setValue(data[dataIndex]);
        } else {
            setValue(0);
        }
    }, [aimPos, svgW, offset.left, displayCount, displayRange.begin, data]);

    const aim = useMemo(() => {
        const ret: ReactElement[] = [];
        if (!aimPos)
            return ret;
        const stickWidth = svgW / displayCount;
        let index = Math.round(aimPos.x / stickWidth);
        if (index < 0) 
            index = 0;
        else if (index >= displayCount) 
            index = displayCount - 1;
        const x = offset.left + stickWidth * index;
        const y = aimPos.y - offset.top;
        ret.push(<line key="aim-v" x1={x} x2={x} y1={0} y2={svgH + offset.top + bottomH} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        if (y > 0)
            ret.push(<line key="aim-h" x1={offset.left} x2={offset.left + svgW} y1={y} y2={y} stroke={'var(--theme-chart-scale-color)'} strokeWidth={'1px'}/>);
        return ret;
    }, [aimPos, svgW, svgH, offset.left, offset.top, bottomH, displayCount]);


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
            justifyContent: 'start',
            paddingLeft: '10px',
            color: 'var(--theme-chart-scale-color)',
            zIndex: 10
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                height: '100%'
            }}>
                <select 
                    value={selectedIndicator}
                    onChange={(e) => {
                        setSelectedIndicator(e.target.value);
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
                    {SUB_CHART_INDICATOR_OPTIONS.map((indicator) => (
                        <option key={indicator} value={indicator} style={{
                            backgroundColor: 'var(--theme-chart-bg-color)',
                            color: 'var(--theme-chart-scale-color)'
                        }}>
                            {t(`indicators.${indicator}`)}
                        </option>
                    ))}
                </select>
            </div>
            {aimPos && <div style={{
                fontSize: `${p.fontSize}px`,
                marginLeft: '10px'
            }}>
                {t(`indicators.${selectedIndicator}`)}:{value}
            </div>}
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