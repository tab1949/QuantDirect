import { CandleStickChartData, Indicator, IndicatorResult, IndicatorDisplay } from "./MarketData";

function NONE(): Indicator {
    return new Indicator("", "", [], [], [],  [], "preset", () => {return []});
}

function MA(): Indicator {
    return new Indicator("MA", "Moving Average", 
        [5, 10, 30, 60], 
        ["MA5", "MA10", "MA30", "MA60"],
        [IndicatorDisplay.LINE, IndicatorDisplay.LINE, IndicatorDisplay.LINE, IndicatorDisplay.LINE], 
        [{color: '#d025ff', weight: '1'}, {color: '#25afff', weight: '1'}, {color: '#25ffb3', weight: '1'}, {color: '#c1ff25', weight: '1'}],
        "preset", 
        (args: CandleStickChartData[], param: number[]): IndicatorResult[] => {
        const ret: IndicatorResult[] = [];
        for (let k = 0; k < 4; ++k) {
            ret.push([]);
            let sum: number = 0;
            const duration = param[k];
            for (let i = 0; i < args.length; ++i) {
                sum += args[i].close;
                if (i >= duration) {
                    sum -= args[i - duration].close;
                    ret[k].push(sum / duration);
                }
                else {
                    ret[k].push(-1); 
                }
            }
        }
        return ret;
    });
}

export function GetIndicatorByName(name: string): Indicator|undefined {
    switch(name.toUpperCase()) {
    case 'MA':
        return MA();
    default:
        return NONE();
    }
}