import RedisService from "./redisService";
import { getRequestData, fetchFromUpstream, DataType } from "./upstream";
import * as Backup from "./backup";
import logger from "../logger";

const exchanges = ['DCE', 'CFFEX', 'CZCE', 'GFEX', 'INE', 'SHFE'];

export async function updateFuturesContractList(redis: RedisService, config: any): Promise<void> {
    
    let requestData = getRequestData(config.upstream, DataType.FUTURES_LIST);

    const backup_d: string = config.upstream.backup_dir;
    const currentDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
    let listDate = currentDate;
    logger.info("------- Tradable Lists Update --------");
    if (!Backup.CheckBackupIntegrity(backup_d)) {
        logger.warn(`Backup directory integrity check failed, attempt to fix ...`);
        Backup.CreateBackupDirectory(backup_d);
        logger.info("Attempt to fetch history data...");
        await redis.flush();
        listDate = ""; // Fetch entire list
    }
    for (const exchange of exchanges) {
        try {
            if (listDate != "") {
                try {
                    if ((await redis.getContractList(exchange)).length == 0) { // List not updated but not existed in redis
                        listDate = "";
                        logger.warn(`${exchange}: List not found in Redis.`);
                    }
                }
                catch (e) {
                    logger.error(`${exchange}: Error getting contract list from Redis:`, e);
                }
            }
            requestData.body.params.exchange = exchange;
            requestData.body.params.list_date = listDate;

            fetchFromUpstream(requestData).then((resp) => {
                let data = resp.data.data;

                if (resp.data.code !== 0) {
                    logger.error(`${exchange}: API error - ${data.msg}`);
                    return;
                } 
                if (data.items.length == 0) { // Already up-to-date
                    logger.log(`${exchange}: already up-to-date`);
                    return;
                } 

                if (listDate != "") {
                    Backup.UpdateFuturesContractList(backup_d, exchange, data.items);
                    redis.updateFuturesContractInfo(data, exchange);
                    let symbol = new Array<string>;
                    for (let item of data.items) symbol.push(item[1]);
                    logger.info(`Added ${symbol.length} ${exchange} contract(s): ${symbol}`);
                    return;
                }
                Backup.CreateFuturesContractList(backup_d, exchange, JSON.stringify(data));
                redis.initFuturesContractInfo(data, exchange);
                logger.info(`Initialized ${exchange} contract list, updated ${data.items.length} items.`);

            });
        } catch (error) {
            logger.error(`Error fetching futures list for ${exchange}:`, error);
        }
    }
    logger.info("------- Tradable Lists Update Finished --------");
}