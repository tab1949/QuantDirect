import { parentPort, workerData } from "worker_threads";
import { getLogger } from "../../logger";
import RedisService from "./redisService";
import * as Cache from "./cache";
import config from "../../config.json";

const logger = getLogger('database');

let redisService: RedisService | null = null;

// Handler
parentPort?.on("message", async (msg) =>  {
    switch(msg) {
    case "start":
        try {
            redisService = new RedisService(config.redis);
            await redisService.init();
            parentPort?.postMessage("Redis service initialized.");
        } catch (error) {
            logger.error("Failed to initialize Redis service:", error);
            parentPort?.postMessage(`Redis initialization failed: ${error}`);
        }
        break;
    case "check-update":
        try {
            parentPort?.postMessage("Checking updates for Redis cache...");
            if (redisService) {
                await Cache.updateCache(redisService, config.data_dir);
                parentPort?.postMessage("Redis cache updated successfully");
            }
            else {
                throw `Redis not initialized. Redis config: ${config.redis}`;
            }
        } catch (error) {
            logger.error("Error in worker thread (message: check-update):", error);
            parentPort?.postMessage(`Redis cache update failed: ${error}`);
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