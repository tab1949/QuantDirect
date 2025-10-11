import { parentPort, workerData } from "worker_threads";
import logger from "../logger";
import RedisService from "./redisService";
import * as Futures from "./futures";

const workerConfig: { upstream: any; redis: any } = workerData as any;
let redisService: RedisService | null = null;

// Handler
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
            if (redisService) {
                await Futures.updateFuturesContractList(redisService, workerConfig);
                parentPort?.postMessage("Futures lists updated successfully");
            }
            else {
                throw `Redis not initialized. Configuration: ${workerConfig.redis}`;
            }
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