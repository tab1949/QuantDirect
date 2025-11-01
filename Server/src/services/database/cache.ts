import RedisService from "./redisService";
import * as Files from "./files";
import { getLogger } from "../../logger";

const logger = getLogger('cache-update');


export async function updateCache(redis: RedisService, config: Files.DataDirConfig): Promise<void> { 
    logger.info("------- Updating Cache --------");
    const redisDataVer = await redis.getUpdateTime();
    logger.info(`Redis data status: ${redisDataVer? redisDataVer: 'NOT FOUND'}`);

    const fileVer = Files.GetUpdateTime(config);
    if (!fileVer) {
        logger.info("Local file status: NOT FOUND");
        logger.warn("------- Cache Update Failed --------");
        return;
    }
    logger.info("Local file version: ", fileVer);
    if (redisDataVer && redisDataVer >= fileVer) {
        logger.info("No update needs to be performed");
        logger.info("------- Cache Update Finished --------");
        return;
    }
    logger.info("Updating Futures List...");
    const exchanges = ['DCE', 'CFFEX', 'CZCE', 'GFEX', 'INE', 'SHFE'];
    let count: number = 0;
    for (const e of exchanges) {
        const info = Files.ReadFuturesContractList(config, e);
        count += info.items.length;
        redis.resetFuturesContractInfo(info, e);
    }
    await redis.setContractsUpdated(fileVer);
    logger.info(`Futures: ${count} items updated.`)
    logger.info("------- Cache Update Finished --------");
}