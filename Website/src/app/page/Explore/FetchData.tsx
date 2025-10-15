import axios from 'axios';

const api_base = 'http://localhost:4000/api';
const contractInfo = new Map;

export async function GetSubjectAssets(exchange: string): Promise<{name: string, code: string}[]> {
    const response = await axios.get<{name: string, code: string}[]>(
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

export async function GetContractInfo(contract: string): Promise<ContractInfo> {
    if (contractInfo.has(contract))
        return contractInfo.get(contract);
    const resp = await axios.get<string[]>(
        `${api_base}/futures/contract/info/${contract}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 2000,
        }
    );
    const info = {
        code: resp.data[0],
        symbol: resp.data[1], 
        exchange: resp.data[2], 
        name: resp.data[3],
        fut_code: resp.data[4], 
        multiplier: resp.data[5],
        trade_unit: resp.data[6],
        per_unit: resp.data[7],
        quote_unit: resp.data[8],
        quote_unit_desc: resp.data[9],
        d_mode_desc: resp.data[10],
        list_date: resp.data[11],
        delist_date: resp.data[12],
        d_month: resp.data[13],
        trade_time_desc: resp.data[14]
    };
    contractInfo.set(contract, info);
    return info;
}

export async function GetContractData() : Promise<Array<Array<number>>> {
    return [];
}