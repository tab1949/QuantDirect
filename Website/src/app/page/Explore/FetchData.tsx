import axios from 'axios';

// 定义响应数据类型
interface SubjectAssetsResp {
    code: [],
    name: []
}

export async function GetSubjectAssets(exchange: string): Promise<SubjectAssetsResp> {
    const response = await axios.get<SubjectAssetsResp>(
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

export function GetContractsList() {

}

export function GetContractInfo() {

}

export function GetContractData() {
    
}