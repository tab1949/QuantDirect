import fs from "fs";
import { getLogger } from "../../logger";


export interface DataDirConfig {
    root: string,
    status: string,
    futures: {
        root: string,
        contract_info: string,
        contract_data: string,
        options_info: string,
        options_data: string
    },
    stock_cn: {
        list: string,
        data: string
    },
    stock_hk: {
        list: string,
        data: string
    }
};

const logger = getLogger('backup');

export function Exists(dir: string): boolean {
    return fs.existsSync(dir);
}

export interface ContractListData {
    fields: string[],
    items: Array<Array<string|number>>
};

export function ReadFuturesContractList(dir: DataDirConfig, exchange: string): ContractListData {
    const file = `${dir.root}/${dir.futures.root}/${dir.futures.contract_info}/${exchange}.json`;
    try {
        const data = JSON.parse(fs.readFileSync(file).toString());
        return {fields: data.fields, items: data.items};
    }
    catch (e) {
        logger.error(`Failed to read ${file}, error: ${e}`);
        throw e;
    }
}

export function GetUpdateTime(config: DataDirConfig): string {
    const stat: string = `${config.root}/${config.status}`;
    if (Exists(stat)) {
        return JSON.parse(fs.readFileSync(stat).toString()).update as string;
    }
    else {
        return '';
    }
}