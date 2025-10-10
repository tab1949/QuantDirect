import {Worker} from 'worker_threads';
import path from 'path';
import logger from '../logger';
import RedisService from './redisService';

class DataService {
worker: Worker | null = null;
updateIntervalMinute: NodeJS.Timeout | null = null;
updateIntervalDay: NodeJS.Timeout | null = null;
config: any;
redisService: RedisService | null = null;

constructor(config: any) {
    this.config = config;
}

public async run(): Promise<void> {
    try {
        // Initialize Redis service
        this.redisService = new RedisService(this.config.redis);
        try {
            await this.redisService.init();
            logger.info("Redis service initialized successfully in main process");
        }
        catch (e) {
            logger.error(`Redis service initialization failed, error: ${e}`);
            throw new Error(`Failed to initialize Redis service: ${e}`);
        }


        this.worker = new Worker(path.join(__dirname, 'worker.ts'), {workerData: { upstream: this.config.upstream, redis: this.config.redis }});
        this.worker.on('message', (msg) => {
            logger.info(msg);
        });
        this.worker.on('error', (err) => {
            logger.error('Data service ERROR: ', err);
        });
        this.worker.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`Data service stopped with exit code ${code}`);
            }
        });
        
        this.worker.postMessage('start');
        logger.info("Data worker started.");
        
        // 发送初始更新消息
        this.worker.postMessage('check-updates');
        this.worker.postMessage('check-updates-lists');
        
        // Init intervals
        setTimeout(() => {
            this.updateIntervalMinute = setInterval(() => {
                this.worker?.postMessage('check-updates');
            }, 60_000); // 1 minute
        }, 60_000 - (Date.now() % 60_000));
        
        setTimeout(() => {
            this.updateIntervalDay = setInterval(() => {
                this.worker?.postMessage('check-updates-lists');
            }, 1000*3600*24); // 1 day
        }, 1000*3600*24 - (Date.now() % (1000*3600*24))); // Align to midnight
        
    } catch (error) {
        logger.error('Failed to start data service:', error);
        throw error;
    }
}

public async stop(): Promise<void> {
    try {
        if (this.worker) {
            this.worker.postMessage('stop');
            this.worker = null;
        }
        
        if (this.redisService) {
            await this.redisService.stop();
            this.redisService = null;
        }
        
        // Clear intervals
        if (this.updateIntervalMinute) {
            clearInterval(this.updateIntervalMinute);
            this.updateIntervalMinute = null;
        }
        
        if (this.updateIntervalDay) {
            clearInterval(this.updateIntervalDay);
            this.updateIntervalDay = null;
        }
        
        logger.info("Data service stopped");
    } catch (error) {
        logger.error('Error stopping data service:', error);
        throw error;
    }
}

public async query(): Promise<any> {
    if (!this.redisService) {
        throw new Error('Redis service not initialized');
    }
    
    try {
        const health = await this.redisService.healthCheck();
        return {
            status: 'ok',
            redis: health,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Query error:', error);
        throw error;
    }
}

public async getMarketData(symbol?: string, dataType: string = 'market'): Promise<any> {
    if (!this.redisService) {
        throw new Error('Redis service not initialized');
    }
    
    try {
        
    } catch (error) {
        logger.error('Get market data error:', error);
        throw error;
    }
}

public async getContractsList(exchange: string): Promise<any> {
    if (!this.redisService) {
        throw new Error('Redis service not initialized');
    }
    
    try {
        return this.redisService.getContractsList(exchange);
    } catch (error) {
        logger.error('Get futures list error:', error);
        throw error;
    }
}

public async getContractInfo(contract: string): Promise<any> {
    if (!this.redisService) {
        throw new Error('Redis service not initialized');
    }

    try {
        return this.redisService.getContractInfo(contract);
    } catch (e) {
        logger.error(`Get contract info error: ${e}`);
        throw e;
    }
}

}

export default function dataService(config: any): DataService {
    return new DataService(config);
}