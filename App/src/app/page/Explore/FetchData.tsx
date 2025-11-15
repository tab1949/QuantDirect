import axios from 'axios';

const api_base = 'http://localhost:888/api';
const contractInfo = new Map;

export async function GetSubjectAssets(exchange: string): Promise<{code: string, name: string}[]> {
    const response = await axios.get<{code: string, name: string}[]>(
        `${api_base}/futures/contract/assets/${exchange}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 2000,
        }
    );
    return response.data;
}

export async function GetContractsList(exchange: string): Promise<string[]> {
    const response = await axios.get<string[]>(
        `${api_base}/futures/contract/list/${exchange}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 2000,
        }
    );
    return response.data;
}

export interface ContractInfo {
    code: string,
    symbol: string, 
    exchange: string, 
    name: string,
    fut_code: string, 
    multiplier: string,
    trade_unit: string,
    per_unit: string,
    quote_unit: string,
    quote_unit_desc: string,
    d_mode_desc: string,
    list_date: string,
    delist_date: string,
    d_month: string,
    trade_time_desc: string
} 

export async function GetContractInfoByAsset(name: string, exchange: string): Promise<ContractInfo[]> {
    if (contractInfo.has(name))
        return contractInfo.get(name);
    const resp = await axios.get<string[][]>(
        `${api_base}/futures/contract/info/${name}?g&e=${exchange}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 2000,
        }
    );
    const info: ContractInfo[] = [];
    for (const i of resp.data) {
        info.push({
        code: i[0],
        symbol: i[1], 
        exchange: i[2], 
        name: i[3],
        fut_code: i[4], 
        multiplier: i[5],
        trade_unit: i[6],
        per_unit: i[7],
        quote_unit: i[8],
        quote_unit_desc: i[9],
        d_mode_desc: i[10],
        list_date: i[11],
        delist_date: i[12],
        d_month: i[13],
        trade_time_desc: ''//i[15]
        });
    }
    contractInfo.set(name, info);
    return info;
}

export interface FuturesContractData {
    fields: string[],
    data: Array<Array<string|number>>
}

export async function GetContractData(contract: string) : Promise<FuturesContractData|null> {
    try {
        const response = await axios.get<FuturesContractData>(
            `${api_base}/futures/contract/data/${contract}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 2000,
            }
        );
        return response.data;
    }
    catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
            return null;
        }
        return null;
    }
}