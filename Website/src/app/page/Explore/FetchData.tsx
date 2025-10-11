import axios from 'axios';

export async function GetSubjectAssets(exchange: string): Promise<{name: string, code: string}[]> {
    const response = await axios.get<{name: string, code: string}[]>(
        `http://localhost:888/api/futures/contract/assets/${exchange}`,
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
        `http://localhost:888/api/futures/contract/list/${exchange}`,
        {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 2000,
        }
    );
    return response.data;
}

export function GetContractInfo() {

}

export function GetContractData() {
    
}