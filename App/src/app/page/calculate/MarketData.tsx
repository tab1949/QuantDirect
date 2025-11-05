import { JSX } from "react";

export interface ArrayedData {
    fields: string[], 
    data: Array<Array<string|number>>
};

export interface CandleStickChartData {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    open_interest: number;
};

function CandleStickChartData(): CandleStickChartData[] {
    return [];
};

export const PERIOD_OPTIONS = [
    '1min', '3min', '5min', '15min', 
    '30min', '60min',
    '1day', '3day', '1week', '1month', '1quarter', '1year'
];

// Set wider ranges to avoid special conditions
const NIGHT_BEGIN_HOUR: number = 21;
const DAY_BEGIN_HOUR = 8; 

export class StaticMarketData {
    private dataMin: CandleStickChartData[];
    private dataDay: CandleStickChartData[];

    constructor(data: ArrayedData) {
        this.dataMin = CandleStickChartData();
        this.dataDay = CandleStickChartData();
        
        const index = {
            time: -1,
            open: -1,
            close: -1,
            high: -1,
            low: -1,
            volume: -1,
            amount: -1,
            open_interest: -1
        };
        data.fields.forEach((v: string, i: number) => { 
            switch(v) {
            case 'datetime':
                index.time = i;
                break;
            case 'open':
                index.open = i;
                break;
            case 'close':
                index.close = i;
                break;
            case 'high': 
                index.high = i;
                break;
            case 'low':
                index.low = i;
                break;
            case 'volume':
                index.volume = i;
                break;
            case 'money':
                index.amount = i;
                break;
            case 'open_interest':
                index.open_interest = i;
                break;
            }
        });
        data.data.forEach((v: Array<string|number>) => {
            this.dataMin.push({
                time: v[index.time] as string,
                open: v[index.open] as number,
                close: v[index.close] as number,
                high: v[index.high] as number,
                low: v[index.low] as number,
                volume: v[index.volume] as number,
                amount: v[index.amount] as number,
                open_interest: 0
            });
        });
        if (index.open_interest !== -1) { // Only if open_interest is available
            data.data.forEach((v: Array<string|number>, i: number) => {
                this.dataMin[i].open_interest = v[index.open_interest] as number;
            });
        }
        
        this.aggregateToDay();
    }

    public getData(period: string): CandleStickChartData[] {
        if (period === '1min')
            return this.dataMin;
        if (period === '1day') 
            return this.dataDay;
        
        return [];
    }

    // only invoked in constructor
    private aggregateToDay(): void {
        if (this.hasNightSession()) {
            const tradingDays: string[] = [];
            for (let i = 0; i < this.dataMin.length; ++i) {
                const date = new Date(this.dataMin[i].time);
                if (date.getHours() >= DAY_BEGIN_HOUR && date.getHours() < NIGHT_BEGIN_HOUR) {
                    tradingDays.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
                }
                else {
                    tradingDays.push('');
                }
            }
            let date: string = this.dataMin[this.dataMin.length - 1].time.split(' ')[0];
            for (let i = this.dataMin.length - 1; i >= 0; --i) {
                if (tradingDays[i] !== '')
                    date = tradingDays[i];
                else
                    tradingDays[i] = date;
            }
            let begin = 0;
            let lastDate = tradingDays[0];
            for (let i = 0; i < tradingDays.length; ++i) {
                if (tradingDays[i] != lastDate) {
                    this.dataDay.push(this.aggregate(this.dataMin, begin, i - 1, lastDate));
                    begin = i;
                }
                lastDate = tradingDays[i];
            }
            if (lastDate !== tradingDays[tradingDays.length - 2])
                this.dataDay.push(this.aggregate(this.dataMin, begin, this.dataMin.length - 1, lastDate));
            return;
        }
        let begin = 0;
        let lastDate = new Date(this.dataMin[0].time);
        for (let i = 0; i < this.dataMin.length; ++i) {
            const currentDate = new Date(this.dataMin[i].time);
            if (currentDate.getDate() != lastDate.getDate()) {
                this.dataDay.push(this.aggregate(this.dataMin, begin, i - 1, lastDate.toISOString().split('T')[0]));
                begin = i;
            }
            lastDate = currentDate;
        }

    }

    private hasNightSession(): boolean {
        if (this.dataMin.length <= 0)
            return false;
        let ret: boolean = false;
        for (let i = 1; i < this.dataMin.length; ++i) {
            const currentHour = (new Date(this.dataMin[i].time)).getHours();
            if (currentHour >= NIGHT_BEGIN_HOUR || currentHour < DAY_BEGIN_HOUR) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    private aggregate(data: CandleStickChartData[], begin: number, end: number, time: string): CandleStickChartData {
        const ret: CandleStickChartData = {
            time: time,
            open: data[begin].open,
            close: data[end].close,
            high: data[begin].high,
            low: data[begin].low,
            volume: 0,
            amount: 0,
            open_interest: data[end].open_interest
        };
        for (let i = begin; i <= end; i++) {
            ret.volume += data[i].volume;
            ret.amount += data[i].amount;
            if (data[i].high > ret.high) ret.high = data[i].high;
            if (data[i].low < ret.low) ret.low = data[i].low;
        }
        return ret;
    }
    
}

export const INDICATOR_OPTIONS = [
    'MA', 'EXPMA', 'BOLL'
];

export enum IndicatorDisplay {
    NONE, LINE, BAR, POINT, MARK
};

export interface IndicatorDisplayStyle {
    color?: string;
    weight?: string;
};

export type IndicatorResult = number[];

export type CalcFunction = (args: CandleStickChartData[], param: number[]) => IndicatorResult[];

class IndicatorCalc {
    private readonly calc: CalcFunction;

    constructor(calc: CalcFunction) {
        this.calc = calc;
    }

    public calculate(data: CandleStickChartData[], param: number[]): IndicatorResult[] {
        return this.calc(data, param);
    }
}; // class IndicatorCalc

export class Indicator {
    public readonly name: string;
    public readonly description?: string;
    public readonly calc: IndicatorCalc;
    public readonly param: number[];
    public readonly display: IndicatorDisplay[];
    public readonly style: IndicatorDisplayStyle[];
    public readonly source: 'preset' | 'custom';
    public data: IndicatorResult[];
    public readonly resultDesc: string[];

    constructor(
        name: string, 
        description: string,
        param: number[],
        resultDesc: string[],
        display: IndicatorDisplay[], 
        style: IndicatorDisplayStyle[],
        source: 'preset' | 'custom',
        calc: CalcFunction) {

        this.name = name;
        this.description = description;
        this.calc = new IndicatorCalc(calc);
        this.param = param;
        this.resultDesc = resultDesc;
        this.display = display;
        this.style = style;
        this.source = source;
        this.data = [];
    }

    public toString(): string {
        let ret: string = '';
        ret = '';
        return ret;
    }

    public updateData(data: CandleStickChartData[]) {
        this.data = this.calc.calculate(data, this.param);
    }

}; // class Indicator
