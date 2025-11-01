import { getLogger } from "../logger";
import { DataService } from "./database/dataService";

const logger = getLogger('futures_service');

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

export async function getContractBySymbol(symbol: string): Promise<any> {
  if (database !== null)
    return database.getContractInfo(symbol);
  else
    logger.error(`Redis service is not configured.`);
}

export async function getContractByAsset(asset: string, exchange: string): Promise<any> {
  if (database !== null)
    return database.getContractInfoByAsset(asset, exchange);
  else
    logger.error(`Redis service is not configured.`);
} 

export async function getAssets(exchange: string): Promise<any> {
  if (database !== null)
    return database.getSubjectAssets(exchange);
  else
    logger.error(`Redis service is not configured.`);
}

export async function getFuturesData(code: string): Promise<any> {
  if (database !== null) 
    return database.getFuturesData(code);
  else
    logger.error(`Redis service is not configured.`);

}