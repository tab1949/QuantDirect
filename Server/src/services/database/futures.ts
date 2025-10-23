import RedisService from "./redisService";
import { getRequestData, fetchFromUpstream, DataType } from "./upstream";
import * as Backup from "./backup";
import { getLogger } from "../../logger";

const logger = getLogger('futures');

export async function updateFuturesContractList(redis: RedisService, config: any): Promise<void> {
    let exchanges = ['DCE', 'CFFEX', 'CZCE', 'GFEX', 'INE', 'SHFE'];
    
    let requestData = getRequestData(config.upstream, DataType.FUTURES_LIST);

    const backup_d: string = config.upstream.backup_dir;
    const currentDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
    let listDate = currentDate;
    logger.info("------- Tradable Lists Update --------");
    const redisDataVer = await redis.getUpdateTime();
    const jsonDataVer = Backup.GetUpdateTime(backup_d);
    logger.info(`Redis data status: ${redisDataVer?redisDataVer:'NOT FOUND'}`);
    logger.info(`Backup data status: ${jsonDataVer?jsonDataVer:'NOT FOUND'}`);
    if (!Backup.CheckBackupIntegrity(backup_d)) {
        logger.warn(`Backup directory integrity check failed, attempt to fix ...`);
        Backup.CreateBackupDirectory(backup_d);
        // Make up json files from Redis database
        if (redisDataVer && redisDataVer >= currentDate) {
            // Redis up-to-date, but missing json
            logger.info("Fixed backup files using data in Redis");
            for (const e of exchanges) {
                const list = await redis.getContractList(e);
                let info: any[] = [];
                for (const i of list) {
                    const temp = await redis.getContractInfo(i);
                    info.push(temp);
                }
                Backup.CreateFuturesContractList(backup_d, e, JSON.stringify({fields: ["ts_code","symbol","exchange","name","fut_code","multiplier","trade_unit","per_unit","quote_unit","quote_unit_desc","d_mode_desc","list_date","delist_date","d_month","trade_time_desc"], items: info}))
            }
            Backup.SetUpdateTime(backup_d, currentDate);
            exchanges = []; // Skip data fetching loop
        }
        else { 
            logger.info("Empty backup, and redis outdated. Attempt to fetch history data...");
            await redis.flush();
            listDate = ""; // Fetch entire list
        }
    } 
    else if (redisDataVer === null || jsonDataVer > redisDataVer) {
        // /\ 
        // Redis outdated or json is newer

        if (jsonDataVer >= currentDate) {
            // Json is up-to-date
            logger.warn("Redis is empty or outdated, but backup files is up-to-date.");
            logger.log("Loading data from backup into Redis...");
            await redis.flush();
            // Load from json file
            for (const exchange of exchanges) {
                const data = Backup.ReadFuturesContractList(backup_d, exchange);
                redis.initFuturesContractInfo(data, exchange);
            }
            Backup.SetUpdateTime(backup_d, currentDate);
            exchanges = []; // Skip data fetching loop
        }
    }
    if (jsonDataVer && redisDataVer) {
        // No need to update && JSON up-to-date && Redis up-tu-date
        // \/
        if (listDate == currentDate && jsonDataVer >= currentDate && redisDataVer >= currentDate) {
            logger.info("Local data is up-tp-date. No need to fetch from internet.");
            logger.info("------- Tradable Lists Update Finished --------");
            return;
        }
        else { // Update needed, but no need to fetch all history data
            listDate = jsonDataVer < redisDataVer ? jsonDataVer : redisDataVer;
        }
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

            const resp = await fetchFromUpstream(requestData);
            let data = resp.data.data;

            if (resp.data.code !== 0) {
                logger.error(`${exchange}: API error - ${data.msg}`);
                continue;
            } 
            if (data.items.length == 0) { // Already up-to-date
                Backup.SetUpdateTime(backup_d, currentDate);
                await redis.setContractsUpdated(currentDate);
                logger.log(`${exchange}: already up-to-date`);
                continue;
            } 

            if (listDate != "") {
                Backup.UpdateFuturesContractList(backup_d, exchange, data.items);
                await redis.updateFuturesContractInfo(data, exchange);
                Backup.SetUpdateTime(backup_d, currentDate);
                await redis.setContractsUpdated(currentDate);
                let symbol = new Array<string>;
                for (let item of data.items) symbol.push(item[1]);
                logger.info(`Added ${symbol.length} ${exchange} contract(s): ${symbol}`);
                continue;
            }
            Backup.CreateFuturesContractList(backup_d, exchange, JSON.stringify(data));
            await redis.initFuturesContractInfo(data, exchange);
            Backup.SetUpdateTime(backup_d, currentDate);
            await redis.setContractsUpdated(currentDate);
            logger.info(`Initialized ${exchange} contract list, updated ${data.items.length} items.`);
        } catch (error) {
            logger.error(`Error fetching futures list for ${exchange}:`, error);
        }
    }
    await redis.setContractsUpdated(currentDate);
    logger.info("------- Tradable Lists Update Finished --------");
}