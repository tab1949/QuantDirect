const api_base = 'http://localhost:888/api';
const REQUEST_TIMEOUT = 2000;
const contractInfo = new Map<string, ContractInfo[]>();

interface FetchOptions {
    allowNotFound?: boolean;
}

async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        if (response.status === 404 && options.allowNotFound) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return (await response.json()) as T;
    } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function GetSubjectAssets(exchange: string): Promise<{code: string, name: string}[]> {
    const data = await fetchJson<{code: string, name: string}[]>(
        `${api_base}/futures/contract/assets/${exchange}`
    );
    return data || [];
}

export async function GetContractsList(exchange: string): Promise<string[]> {
    const data = await fetchJson<string[]>(
        `${api_base}/futures/contract/list/${exchange}`
    );
    return data || [];
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
        return contractInfo.get(name) as ContractInfo[];
    const resp = await fetchJson<string[][]>(
        `${api_base}/futures/contract/info/${name}?g&e=${exchange}`
    );
    const info: ContractInfo[] = [];
    if (!resp) {
        return info;
    }
    for (const i of resp) {
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
        const data = await fetchJson<FuturesContractData>(
            `${api_base}/futures/contract/data/${contract}`,
            { allowNotFound: true }
        );
        return data;
    }
    catch (_error) {
        void _error;
        return null;
    }
}