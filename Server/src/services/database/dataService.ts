import {Worker} from 'worker_threads';
import path from 'path';
import { getLogger } from '../../logger';
import RedisService from './redisService';
import fs from 'fs';

const logger = getLogger('database');

const exchange_postfix: { [key: string]: string } = {
    'DCE': '.DCE',
    'CZCE': '.ZCE',
    'SHFE': '.SHF',
    'GFEX': '.GFE',
    'CFFEX': '.CFX',
    'INE': '.INE'
}

const exchange_alias: { [key: string]: string } = {
    'ZCE': 'CZCE',
    'CZCE': 'ZCE',
    'SHF': 'SHFE',
    'SHFE': 'SHF',
    'GFE': 'GFEX',
    'GFEX': 'GFE',
    'CFX': 'CFFEX',
    'CFFEX': 'CFX',
    'DCE': 'DCE',
    'INE': 'INE'
}

export class DataService {
    worker: Worker | null = null;
    updateInterval: NodeJS.Timeout | null = null; // This is used for updating Redis
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

            // Determine worker file path based on environment
            // In dev mode with tsx, use worker.ts; in production, use compiled worker.js
            const isDev = __filename.endsWith('.ts');
            const workerFile = isDev ? 'worker.ts' : 'worker.js';
            const workerPath = path.join(__dirname, workerFile);
            
            // In development, tsx needs to be registered for worker threads
            // Use tsx/cjs to enable TypeScript support in worker threads
            const execArgv = isDev ? [
                '--require', 'tsx/cjs'
            ] : [];
            
            this.worker = new Worker(workerPath, {
                workerData: { upstream: this.config.upstream, redis: this.config.redis },
                execArgv
            });
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
            logger.info("DataService worker started.");
            
            this.worker.postMessage('check-update');
            
            // Check market data update
            // Interval: 1 minute
            setTimeout(() => {
                this.updateInterval = setInterval(() => {
                    this.worker?.postMessage('check-update');
                }, 60_000);
            }, 60_000 - (Date.now() % 60_000));
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
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            logger.info("Data service stopped");
        } catch (error) {
            logger.error('Error stopping data service:', error);
            throw error;
        }
    }

    public async healthCheck(): Promise<string> {
        if (!this.redisService)
            return 'Redis service not initialized';
        
        try {
            if (await this.redisService.healthCheck()) 
                return 'OK';
            else 
                return "Redis not connected";
        } catch (error) {
            logger.error('Query error:', error);
            throw error;
        }
    }

    public async getContractsList(exchange: string): Promise<Array<string>> {
        if (!this.redisService) {
            throw new Error('Redis service not initialized');
        }
        
        try {
            return this.redisService.getContractList(exchange);
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

    public async getContractInfoByAsset(name: string, ex: string): Promise<any[]> {
        if (!this.redisService) {
            throw new Error('Redis service not initialized');
        }

        try {
            const cacheIndex = `contracts.${ex}.${name}`;
            const cache = await this.redisService.getCache(cacheIndex);
            if (cache !== null)
                return cache;
            const list = await this.redisService.getContractList(ex);
            const ret: any[] = [];
            for (const i of list) {
                if (i.replace(exchange_postfix[ex], '').replace(/(TAS|连续|主力)$/g, '').replace(/\d+$/, '') == name) {
                    ret.push(await this.redisService.getContractInfo(i));
                }
            }
            this.redisService.setCache(cacheIndex, ret, 3600); // Expires 1 hour later
            return ret;
        } catch (e) {
            logger.error(`Get contract info error: ${e}`);
            throw e;
        }
    }

    public async getSubjectAssets(exchange: string): Promise<any> {
        if (!this.redisService) {
            throw new Error('Redis service not initialized');
        }

        try {
            return this.redisService.getSubjectAssets(exchange);
        } catch (e) {
            logger.error(`Get contract info error: ${e}`);
            throw e;
        }
    }

    public async getFuturesData(code: string): Promise<any> {
        const [contract, exchange] = code.split('.', 2);
        const asset = contract.match(/^[A-Za-z]+/)?.[0] || '';
        const paths = this.config.data_dir;
        const path: string = `${paths.root}/${paths.futures.root}/${paths.futures.contract_data}/${exchange_alias[exchange]}/${asset}/${contract}.json`;
        if (fs.existsSync(path))
            return JSON.parse(await fs.promises.readFile(path, 'utf8'));
        return null;
    }

}; // class DataService

export default function dataService(config: any): DataService {
    return new DataService(config);
}