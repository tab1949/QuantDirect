import { parentPort, workerData } from "worker_threads";
import logger from "../logger";
import fs from "fs";

import { getRequestData, fetchFromUpstream, DataType } from "./upstream";
import RedisService from "./redisService";

const config = workerData;
let redisService: RedisService | null = null;

async function fetchCurrentFuturesList(): Promise<void> {
    if (!redisService) {
        logger.error('Redis service not initialized');
        return;
    }

    const exchanges = ['DCE', 'CFFEX', 'CZCE', 'GFEX', 'INE', 'SHFE'];
    
    let requestData = getRequestData(config, DataType.FUTURES_LIST);
    requestData.body.params.date = new Date().toISOString().slice(0,10).replace(/-/g, '');
    for (const exchange of exchanges) {
        try {
            requestData.body.params.exchange = exchange;
            
            const resp = await fetchFromUpstream(requestData);
            
            if (resp.data.code === 0) {
                const tradeCodes = resp.data.data.items.map((item: any) => (item.symbol));
                
                // Save to Redis
                await redisService.updateFuturesList(resp.data.data, exchange, requestData.body.params.date);
                
                // Save to local file for backup
                fs.writeFile(`./data_backup/list_${exchange}.json`, JSON.stringify(resp.data.data), (err) => {
                    if (err) logger.error(`Error writing ./data_backup/list_${exchange}.json:`, err);
                });
                
                logger.info(`${exchange}: updated ${tradeCodes.length} items to Redis and data_backup/list_${exchange}.json.`);
            } else {
                logger.error(`${exchange}: API error - ${resp.data.msg}`);
            }
        } catch (error) {
            logger.error(`Error fetching futures list for ${exchange}:`, error);
        }
    }
}

parentPort?.on("message", async (msg) =>  {
    switch(msg) {
    case "start":
        try {
            // 初始化Redis服务
            redisService = new RedisService(config.redis);
            await redisService.init();
            parentPort?.postMessage("Redis service initialized.");
        } catch (error) {
            logger.error("Failed to initialize Redis service:", error);
            parentPort?.postMessage(`Redis initialization failed: ${error}`);
        }
        break;
    case "check-updates":
        try {
            let update = {
                market: "Futures, Stocks, ",
                type: "1min, ",
                info: "Market data updated."
            };
            parentPort?.postMessage(`Data update available.\nMarket: ${update.market};\nType: ${update.type};\nInfo: ${update.info}`);
        } catch (error) {
            logger.error("Error in check-updates:", error);
        }
        break;
    case "check-updates-lists":
        try {
            parentPort?.postMessage("Checking updates for tradable lists...");
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