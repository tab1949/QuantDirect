import logger from "../logger";
import {DataService} from "../database/dataService";

let database: DataService | null;

export default function setDataSource(dataSource: any) {
    database = dataSource;
}

export async function getContractsList(exchange: string): Promise<any> {
    if (database !== null)
        return database.getContractsList(exchange);
    else
        logger.error(`Redis service is not configured.`);
}

export async function getContractInfo(contract: string): Promise<any> {
    if (database !== null)
        return database.getContractInfo(contract);
    else
        logger.error(`Redis service is not configured.`);
}

export async function getSubjectAssets(exchange: string): Promise<any> {
    if (database !== null)
        return database.getSubjectAssets(exchange);
    else
        logger.error(`Redis service is not configured.`);
}