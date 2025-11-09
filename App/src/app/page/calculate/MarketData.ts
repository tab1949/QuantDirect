export interface ArrayedData {
    fields: string[], 
    data: Array<Array<string|number>>
};

export interface CandleStickChartDataUnit {
    time: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    open_interest: number;
};

export class CandleStickChartData {
    public data: CandleStickChartDataUnit[];
    public constructor() {
        this.data = [];
    }

    public getData(): CandleStickChartDataUnit[] {
        return this.data;
    }

    public push(data: CandleStickChartDataUnit) {
        this.data.push(data);
    }

    public length(): number {
        return this.data.length;
    }

    public MA(duration: number): number[] { // Moving Average
        const ret: number[] = [];
        if (this.length() < duration)
            return ret;
        let sum: number = 0;
        for (let i = 0; i < this.data.length; ++i) {
            sum += this.data[i].close;
            if (i >= duration) {
                sum -= this.data[i - duration].close;
                ret.push(sum / duration);
            }
            else {
                ret.push(-1);
            }
        }
        return ret;
    }

    public EXPMA(duration: number): number[] { // Exponential Moving Average
        const ret: number[] = [];
        if (this.length() < duration)
            return ret;
        for (let i = 0; i < this.data.length; ++i) {
            if (i == 0) {
                ret.push(this.data[i].close);
            }
            else {
                ret.push((this.data[i].close * 2 + ret[i - 1] * (duration - 1)) / (duration + 1));
            }
        }
        return ret;
    }

    public Turnover(): number[] { // Turnover
        const ret: number[] = [];
        for (let i = 0; i < this.data.length; ++i) {
            ret.push(this.data[i].volume);
        }
        return ret;
    }

    public Amount(): number[] { // Amount
        const ret: number[] = [];
        for (let i = 0; i < this.data.length; ++i) {
            ret.push(this.data[i].amount);
        }
        return ret;
    }
};

export const PERIOD_OPTIONS = [
    '1min', '3min', '5min', '15min', 
    '30min', '60min',
    '1day', '1week', '1month', '1year'
];

// Set wider ranges to avoid special conditions
const NIGHT_BEGIN_HOUR: number = 21;
const DAY_BEGIN_HOUR = 8; 

export class StaticMarketData {
    private dataMin: CandleStickChartData;
    private dataDay: CandleStickChartData;

    constructor(data: ArrayedData) {
        this.dataMin = new CandleStickChartData();
        this.dataDay = new CandleStickChartData();
        
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
                this.dataMin.data[i].open_interest = v[index.open_interest] as number;
            });
        }
        
        this.aggregateToDay();
    }

    public getData(period: string): CandleStickChartData {
        if (period === '1min')
            return this.dataMin;
        if (period === '1day') 
            return this.dataDay;
        if (period === '1week')
            return this.aggregateToWeek();
        if (period === '1month')
            return this.aggregateToMonth();
        if (period === '1year')
            return this.aggregateToYear();
        
        const minuteMatch = period.match(/^(\d+)min$/);
        if (minuteMatch) {
            const minutes = parseInt(minuteMatch[1]);
            if (minutes >= 3 && minutes <= 60) {
                return this.aggregateToMinutes(minutes);
            }
        }
        
        return new CandleStickChartData();
    }

    private aggregateToMinutes(periodMinutes: number): CandleStickChartData {
        const result = new CandleStickChartData();
        if (this.dataMin.length() === 0) {
            return result;
        }

        let begin = 0;
        let periodStartTime = new Date(this.dataMin.data[0].time);

        for (let i = 1; i < this.dataMin.length(); ++i) {
            const currentTime = new Date(this.dataMin.data[i].time);
            const timeDiff = (currentTime.getTime() - periodStartTime.getTime()) / (60000);

            if (timeDiff >= periodMinutes) {
                const timeStr = this.dataMin.data[begin].time;
                result.push(this.aggregate(this.dataMin.data, begin, i - 1, timeStr));
                begin = i;
                periodStartTime = currentTime;
            }
        }

        if (begin < this.dataMin.length()) {
            const timeStr = this.dataMin.data[begin].time;
            result.push(this.aggregate(this.dataMin.data, begin, this.dataMin.length() - 1, timeStr));
        }

        return result;
    }

    // only invoked in constructor
    private aggregateToDay(): void {
        if (this.hasNightSession()) {
            const tradingDays: string[] = [];
            for (let i = 0; i < this.dataMin.length(); ++i) {
                const date = new Date(this.dataMin.data[i].time);
                if (date.getHours() >= DAY_BEGIN_HOUR && date.getHours() < NIGHT_BEGIN_HOUR) {
                    tradingDays.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
                }
                else {
                    tradingDays.push('');
                }
            }
            let date: string = this.dataMin.data[this.dataMin.length() - 1].time.split(' ')[0];
            for (let i = this.dataMin.length() - 1; i >= 0; --i) {
                if (tradingDays[i] !== '')
                    date = tradingDays[i];
                else
                    tradingDays[i] = date;
            }
            let begin = 0;
            let lastDate = tradingDays[0];
            for (let i = 0; i < tradingDays.length; ++i) {
                if (tradingDays[i] != lastDate) {
                    this.dataDay.push(this.aggregate(this.dataMin.data, begin, i - 1, lastDate));
                    begin = i;
                }
                lastDate = tradingDays[i];
            }
            if (lastDate !== tradingDays[tradingDays.length - 2])
                this.dataDay.push(this.aggregate(this.dataMin.data, begin, this.dataMin.length() - 1, lastDate));
            return;
        }
        let begin = 0;
        let lastDate = new Date(this.dataMin.data[0].time);
        for (let i = 0; i < this.dataMin.length(); ++i) {
            const currentDate = new Date(this.dataMin.data[i].time);
            if (currentDate.getDate() != lastDate.getDate()) {
                this.dataDay.push(this.aggregate(this.dataMin.data, begin, i - 1, lastDate.toISOString().split('T')[0]));
                begin = i;
            }
            lastDate = currentDate;
        }

    }

    private hasNightSession(): boolean {
        if (this.dataMin.length() <= 0)
            return false;
        let ret: boolean = false;
        for (let i = 1; i < this.dataMin.length(); ++i) {
            const currentHour = (new Date(this.dataMin.data[i].time)).getHours();
            if (currentHour >= NIGHT_BEGIN_HOUR || currentHour < DAY_BEGIN_HOUR) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    private aggregate(data: CandleStickChartDataUnit[], begin: number, end: number, time: string): CandleStickChartDataUnit {
        const ret: CandleStickChartDataUnit = {
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

    private aggregateToWeek(): CandleStickChartData {
        const result = new CandleStickChartData();
        if (this.dataDay.length() === 0) {
            return result;
        }

        const getWeekKey = (date: Date): string => {
            const year = date.getFullYear();
            const weekNum = this.getWeekNumber(date);
            return `${year}-W${String(weekNum).padStart(2, '0')}`;
        };

        let begin = 0;
        let lastWeekKey = getWeekKey(new Date(this.dataDay.data[0].time));

        for (let i = 1; i < this.dataDay.length(); ++i) {
            const currentWeekKey = getWeekKey(new Date(this.dataDay.data[i].time));
            if (currentWeekKey !== lastWeekKey) {
                const timeStr = this.dataDay.data[begin].time;
                result.push(this.aggregate(this.dataDay.data, begin, i - 1, timeStr));
                begin = i;
                lastWeekKey = currentWeekKey;
            }
        }

        if (begin < this.dataDay.length()) {
            const timeStr = this.dataDay.data[begin].time;
            result.push(this.aggregate(this.dataDay.data, begin, this.dataDay.length() - 1, timeStr));
        }

        return result;
    }

    private aggregateToMonth(): CandleStickChartData {
        const result = new CandleStickChartData();
        if (this.dataDay.length() === 0) {
            return result;
        }

        const getMonthKey = (date: Date): string => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return `${year}-${String(month).padStart(2, '0')}`;
        };

        let begin = 0;
        let lastMonthKey = getMonthKey(new Date(this.dataDay.data[0].time));

        for (let i = 1; i < this.dataDay.length(); ++i) {
            const currentMonthKey = getMonthKey(new Date(this.dataDay.data[i].time));
            if (currentMonthKey !== lastMonthKey) {
                const timeStr = this.dataDay.data[begin].time;
                result.push(this.aggregate(this.dataDay.data, begin, i - 1, timeStr));
                begin = i;
                lastMonthKey = currentMonthKey;
            }
        }

        if (begin < this.dataDay.length()) {
            const timeStr = this.dataDay.data[begin].time;
            result.push(this.aggregate(this.dataDay.data, begin, this.dataDay.length() - 1, timeStr));
        }

        return result;
    }

    private aggregateToYear(): CandleStickChartData {
        const result = new CandleStickChartData();
        if (this.dataDay.length() === 0) {
            return result;
        }

        let begin = 0;
        let lastYear = new Date(this.dataDay.data[0].time).getFullYear();

        for (let i = 1; i < this.dataDay.length(); ++i) {
            const currentYear = new Date(this.dataDay.data[i].time).getFullYear();
            if (currentYear !== lastYear) {
                const timeStr = this.dataDay.data[begin].time;
                result.push(this.aggregate(this.dataDay.data, begin, i - 1, timeStr));
                begin = i;
                lastYear = currentYear;
            }
        }

        if (begin < this.dataDay.length()) {
            const timeStr = this.dataDay.data[begin].time;
            result.push(this.aggregate(this.dataDay.data, begin, this.dataDay.length() - 1, timeStr));
        }

        return result;
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }
    
}

export const MAIN_CHART_INDICATOR_OPTIONS = [
    'NONE', 'MA', 'EXPMA', 'BOLL'
];

export const SUB_CHART_INDICATOR_OPTIONS = [
    'TURNOVER', 'AMOUNT'
];

export enum IndicatorDisplay {
    NONE, LINE, BAR, POINT, MARK
};

export interface IndicatorDisplayStyle {
    color?: string;
    weight?: string;
};

export type IndicatorValue = number[];

export interface IndicatorResultParam {
    param?: number;
    describe: string;
    display: IndicatorDisplay;
    style: IndicatorDisplayStyle;
};

export type CalcFunction = (args: CandleStickChartData, param: IndicatorResultParam[]) => IndicatorValue[];

class IndicatorCalc {
    private readonly calc: CalcFunction;

    constructor(calc: CalcFunction) {
        this.calc = calc;
    }

    public calculate(data: CandleStickChartData, param: IndicatorResultParam[]): IndicatorValue[] {
        return this.calc(data, param);
    }
}; // class IndicatorCalc

export class Indicator {
    public readonly name: string;
    public readonly description?: string;
    public readonly param: IndicatorResultParam[];
    public readonly calc: IndicatorCalc;
    public readonly source: 'preset' | 'custom';
    public data: IndicatorValue[];

    constructor(
        name: string, 
        description: string,
        param: IndicatorResultParam[],
        source: 'preset' | 'custom',
        calc: CalcFunction) {

        this.name = name;
        this.description = description;
        this.calc = new IndicatorCalc(calc);
        this.param = param;
        this.source = source;
        this.data = [];
    }

    public toString(): string {
        let ret: string = '';
        ret = '';
        return ret;
    }

    public updateData(data: CandleStickChartData) {
        this.data = this.calc.calculate(data, this.param);
    }

}; // class Indicator
