export interface CandleStickChartData {
    data: {
        time: string[];
        open: number[];
        close: number[];
        high: number[];
        low: number[];
        volume: number[];
        amount: number[];
        open_interest: number[];
    },
    length: number;
}

function CandleStickChartData(): CandleStickChartData {
    return {
        data: {
            time: [], 
            open: [], close: [], high: [], low: [],
            volume: [], amount: [], open_interest: []
        }, 
        length: 0
    };
}

interface FuturesIndexMap {
    time: number; 
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    amount: number;
    open_interest: number;
}

export const PERIOD_OPTIONS = [
    '1min', '3min', '5min', '15min', 
    '30min', '60min',
    '1day', '3day', '1week', '1month', '1quarter', '1year'
];

export class MarketData {
    private dataMin: CandleStickChartData;
    private dataDay: CandleStickChartData;

    constructor(data: {fields: string[], data: Array<Array<string|number>>}) {
        this.dataMin = CandleStickChartData();
        this.dataMin.length = data.data.length;
        this.dataDay = CandleStickChartData();
        
        const index: FuturesIndexMap = {
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
            this.dataMin.data.time.push(v[index.time] as string);
            this.dataMin.data.open.push(v[index.open] as number);
            this.dataMin.data.close.push(v[index.close] as number);
            this.dataMin.data.high.push(v[index.high] as number);
            this.dataMin.data.low.push(v[index.low] as number);
            this.dataMin.data.volume.push(v[index.volume] as number);
            this.dataMin.data.amount.push(v[index.amount] as number);
        });
        if (index.open_interest !== -1) { // Only if open_interest is available
            data.data.forEach((v: Array<string|number>) => {
                this.dataMin.data.open_interest.push(v[index.open_interest] as number);
            });
        }
        
        this.aggregateToDay();  // 移动到这里，数据填充后调用
    }

    public getData(period: string): CandleStickChartData {
        if (period === '1min')
            return this.dataMin;
        if (period === '1day') 
            return this.dataDay;
        
        const ret = CandleStickChartData();
        
        return ret;
    }

    private aggregateToDay(): void {
        const hasOI = this.dataMin.data.open_interest.length > 0;

        if (this.dataMin.length === 0)
            return;

        let currentDay: string | null = null;
        let currentOpen: number = 0;
        let currentHigh: number = 0;
        let currentLow: number = Infinity;
        let currentClose: number = 0;
        let currentVolume: number = 0;
        let currentAmount: number = 0;
        let currentOI: number = 0;

        for (let i = 0; i < this.dataMin.length; i++) {
            const timeStr = this.dataMin.data.time[i];
            const date = new Date(timeStr);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            let tradingDay = `${year}-${month}-${day}`;

            const hours = date.getHours();
            if (hours >= 21) {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                const nextYear = nextDate.getFullYear();
                const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
                const nextDay = String(nextDate.getDate()).padStart(2, '0');
                tradingDay = `${nextYear}-${nextMonth}-${nextDay}`;
            }

            if (currentDay !== null && currentDay !== tradingDay) {
                this.dataDay.data.time.push(currentDay);
                this.dataDay.data.open.push(currentOpen);
                this.dataDay.data.close.push(currentClose);
                this.dataDay.data.high.push(currentHigh);
                this.dataDay.data.low.push(currentLow);
                this.dataDay.data.volume.push(currentVolume);
                this.dataDay.data.amount.push(currentAmount);
                if (hasOI) {
                    this.dataDay.data.open_interest.push(currentOI);
                }
                this.dataDay.length++;

                currentHigh = this.dataMin.data.high[i];
                currentLow = this.dataMin.data.low[i];
                currentOpen = this.dataMin.data.open[i];
                currentClose = this.dataMin.data.close[i];
                currentVolume = this.dataMin.data.volume[i];
                currentAmount = this.dataMin.data.amount[i];
                currentOI = hasOI ? this.dataMin.data.open_interest[i] : 0;
                currentDay = tradingDay;
            } 
            else {
                currentHigh = Math.max(currentHigh, this.dataMin.data.high[i]);
                currentLow = Math.min(currentLow, this.dataMin.data.low[i]);
                currentClose = this.dataMin.data.close[i];
                currentVolume += this.dataMin.data.volume[i];
                currentAmount += this.dataMin.data.amount[i];
                if (hasOI) {
                    currentOI = this.dataMin.data.open_interest[i];
                }

                if (currentDay === null) {
                    currentDay = tradingDay;
                    currentOpen = this.dataMin.data.open[i];
                    currentHigh = this.dataMin.data.high[i];
                    currentLow = this.dataMin.data.low[i];
                    currentClose = this.dataMin.data.close[i];
                    currentVolume = this.dataMin.data.volume[i];
                    currentAmount = this.dataMin.data.amount[i];
                    currentOI = hasOI ? this.dataMin.data.open_interest[i] : 0;
                }
            }
        }

        if (currentDay !== null) {
            this.dataDay.data.time.push(currentDay);
            this.dataDay.data.open.push(currentOpen);
            this.dataDay.data.close.push(currentClose);
            this.dataDay.data.high.push(currentHigh);
            this.dataDay.data.low.push(currentLow);
            this.dataDay.data.volume.push(currentVolume);
            this.dataDay.data.amount.push(currentAmount);
            if (hasOI) {
                this.dataDay.data.open_interest.push(currentOI);
            }
            this.dataDay.length++;
        }
    }
    
}