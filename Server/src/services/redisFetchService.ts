import logger from "../logger";

let database: any = null;

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