import { CandleStickChartData, Indicator, IndicatorValue, IndicatorDisplay, IndicatorResultParam } from "./MarketData";

function NONE(): Indicator {
    return new Indicator("", "", [], "preset", (args: CandleStickChartData, param: IndicatorResultParam[]): IndicatorValue[] => {return []});
}
 
function MA(): Indicator {
    return new Indicator("MA", "Moving Average", 
        [
            {param: 5, describe: "MA5", display: IndicatorDisplay.LINE, style: {color: '#d025ff', weight: '1'}},
            {param: 10, describe: "MA10", display: IndicatorDisplay.LINE, style: {color: '#25afff', weight: '1'}},
            {param: 30, describe: "MA30", display: IndicatorDisplay.LINE, style: {color: '#25ffb3', weight: '1'}},
            {param: 60, describe: "MA60", display: IndicatorDisplay.LINE, style: {color: '#c1ff25', weight: '1'}},
        ],
        "preset", 
        (args: CandleStickChartData, param: IndicatorResultParam[]): IndicatorValue[] => {
        const ret: IndicatorValue[] = [];
        for (let k = 0; k < param.length; ++k) {
            ret.push(args.MA(param[k].param as number));
        }
        return ret;
    });
}

function BOLL(): Indicator {
    return new Indicator("BOLL", "Bollinger Bands", 
        [
            {describe: "MID", display: IndicatorDisplay.LINE, style: {color: '#ebda16', weight: '1'}},
            {describe: "UPPER", display: IndicatorDisplay.LINE, style: {color: '#1681eb', weight: '1'}},
            {describe: "LOWER", display: IndicatorDisplay.LINE, style: {color: '#cb16eb', weight: '1'}}
        ],
        "preset",
        (args: CandleStickChartData, param: IndicatorResultParam[]): IndicatorValue[] => {
            const ret: IndicatorValue[] = [[], [], []];
            const duration = 20;
            if (args.length() < duration)
                return ret;
            // Calculation of Moving Average
            ret[0] = args.MA(duration);
            let sum = 0;
            for (let i = 0; i < args.length(); ++i) {
                if (i >= duration) {
                    const ma = ret[0][i];
                    // Calculation of Standard Deviation
                    sum = 0;
                    for (let k = i - duration + 1; k <= i; ++k) {
                        const dif = (args.data[k].close - ma); 
                        sum += dif * dif;
                    }
                    const root = Math.sqrt(sum / (duration - 1));
                    ret[1].push(ma + 2 * root);
                    ret[2].push(ma - 2 * root);
                }
                else {
                    ret[1].push(-1); 
                    ret[2].push(-1); 
                }
            }

            return ret;
        }
    );
}

function EXPMA(): Indicator {
    return new Indicator("EXPMA", "Exponential Moving Average", 
        [
            {param: 5, describe: "EMA5", display: IndicatorDisplay.LINE, style: {color: '#d025ff', weight: '1'}},
            {param: 10, describe: "EMA10", display: IndicatorDisplay.LINE, style: {color: '#25afff', weight: '1'}},
            {param: 20, describe: "EMA20", display: IndicatorDisplay.LINE, style: {color: '#c8ff25', weight: '1'}},
            {param: 30, describe: "EMA30", display: IndicatorDisplay.LINE, style: {color: '#25ffb3', weight: '1'}},
        ],
        "preset",
        (args: CandleStickChartData, param: IndicatorResultParam[]): IndicatorValue[] => {
            const ret: IndicatorValue[] = [];
            for (let k = 0; k < param.length; ++k) {
                ret.push(args.EXPMA(param[k].param as number));
            }
            return ret;
        }
    );
}
export function GetIndicatorByName(name: string): Indicator|undefined {
    switch(name.toUpperCase()) {
    case 'MA':
        return MA();
    case "BOLL":
        return BOLL();
    case "EXPMA":
        return EXPMA();
    default:
        return NONE();
    }
}