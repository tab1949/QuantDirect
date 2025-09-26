import { parentPort, workerData } from "worker_threads";
import logger from "../logger";
import fs from "fs";

import { getRequestData, fetchFromUpstream, DataType } from "./upstream";
import RedisService from "./redisService";

const workerConfig: { upstream: any; redis: any } = workerData as any;
let redisService: RedisService | null = null;

async function fetchCurrentFuturesList(): Promise<void> {
    if (!redisService) {
        logger.error('Redis service not initialized');
        return;
    }

    const exchanges = ['DCE', 'CFFEX', 'CZCE', 'GFEX', 'INE', 'SHFE'];
    
    let requestData = getRequestData(workerConfig.upstream, DataType.FUTURES_LIST);

    const backup_dir: string = workerConfig.upstream.backup_dir;
    const currentDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
    let listDate = currentDate;
    logger.info("-------Tradable Lists Update--------");
    try {
        fs.readdirSync(backup_dir);
    }
    catch (e) {
        logger.warn(`Directory ${backup_dir} is not existed, attempt to create...`);
        fs.mkdirSync(backup_dir);
        logger.info(`Created ${backup_dir}, backup files will be placed here.`);
        logger.info("Attempt to fetch history data...");
        await redisService.flush();
        listDate = "";
    }
    for (const exchange of exchanges) {
        try {
            requestData.body.params.exchange = exchange;
            requestData.body.params.list_date = listDate;

            let resp = await fetchFromUpstream(requestData);
            let data = resp.data.data;
            
            if (resp.data.code !== 0) {
                logger.error(`${exchange}: API error - ${data.msg}`);
                continue;
            } 
            if (data.items.length > 0) { // List updated
                let tradeCodes = new Array<string>;
                if (data.items.length <= 50) {
                    for (let item of data.items) {
                        tradeCodes.push(item[1]);
                    }
                    logger.info(`New contract(s): ${tradeCodes}`);
                }
                else {
                    logger.info(`${data.items.length} ${exchange} contracts fetched (more than 50 contracts).`)
                }
                // Fetch all contracts
                requestData.body.params.list_date = "";
                resp = await fetchFromUpstream(requestData);
                data = resp.data.data;
                // Save to local file for backup
                const fileName = `${backup_dir}/list_${exchange}_${currentDate}.json`;
                fs.writeFile(fileName, JSON.stringify(data), (err) => {
                    if (err) logger.error(`Error writing ${fileName}`, err);
                });
                // Save to Redis
                await redisService.setFuturesList(data, exchange, listDate);
                logger.info(`${exchange}: updated ${tradeCodes.length} items to Redis and ${fileName}.`);
            } 
        } catch (error) {
            logger.error(`Error fetching futures list for ${exchange}:`, error);
            throw error;
        }
    }
    logger.info("-------Tradable Lists Update--------");
}

parentPort?.on("message", async (msg) =>  {
    switch(msg) {
    case "start":
        try {
            // 初始化Redis服务
            redisService = new RedisService(workerConfig.redis);
            await redisService.init();
            parentPort?.postMessage("Redis service initialized.");
        } catch (error) {
            logger.error("Failed to initialize Redis service:", error);
            parentPort?.postMessage(`Redis initialization failed: ${error}`);
        }
        break;
    case "check-updates":
        try {
            
        } catch (error) {
            logger.error("Error in check-updates:", error);
        }
        break;
    case "check-updates-lists":
        try {
            parentPort?.postMessage("Checking updates for futures lists...");
            await fetchCurrentFuturesList();
            parentPort?.postMessage("Futures lists updated successfully");
        } catch (error) {
            logger.error("Error in check-updates-lists:", error);
            parentPort?.postMessage(`Futures lists update failed: ${error}`);
        }
        break;
    case "stop":
        try {
            if (redisService) {
                await redisService.stop();
                parentPort?.postMessage("Redis service stopped in worker");
            }
        } catch (error) {
            logger.error("Error stopping Redis service:", error);
        }
        break;
    default:
        logger.error(`Data worker: Unknown message: ${msg}`);
    }
});