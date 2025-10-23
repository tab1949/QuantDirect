import { CandleStickChartData } from './MarketData';

export enum ResultType {
    LINE, BAR, POINT, MARK
}

export class IndicatorResult {
    public readonly type: ResultType;

    constructor(type: ResultType) {
        this.type = type;
    }
}; // class IndicatorResult

export type CalcFunction = (args: CandleStickChartData[]) => IndicatorResult;

export class IndicatorCalc {
    private readonly calc: CalcFunction;

    constructor(calc: CalcFunction) {
        this.calc = calc;
    }

    public calculate(data: CandleStickChartData[]): void {
        this.calc(data);
    }
}; // class IndicatorCalc

export class Indicator {
    public readonly name: string;
    public readonly description?: string;
    public readonly calc: IndicatorCalc;
    public readonly inputs: string[];
    public readonly outputs: string[];
    public readonly source: 'preset' | 'custom';
    public readonly category: 'price' | 'volume' | 'momentum' | 'trend' | 'volatility' | 'other';

    constructor(
        name: string, 
        calc: IndicatorCalc, 
        inputs: string[], 
        outputs: string[], 
        source: 'preset' | 'custom', 
        category: 'price' | 'volume' | 'momentum' | 'trend' | 'volatility' | 'other', 
        description?: string) {
        this.name = name;
        this.description = description? description : '';
        this.calc = calc;
        this.inputs = inputs;
        this.outputs = outputs;
        this.source = source;
        this.category = category;
    }

}; // class Indicator
