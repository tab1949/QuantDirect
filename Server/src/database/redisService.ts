import RedisClient from './redisClient';
import logger from '../logger';

const keys = {
    contractList: 'contracts:list',
    contractInfo: 'contracts:info',
    contractAssets: 'contracts:assets',
    contractAssetCodes: 'contracts:asset:code',
    contractUpdateDate: 'contracts:update'
};

class RedisService {
    private redisClient: RedisClient;
    private config: any;

    constructor(config: any) {
        this.config = config;
        this.redisClient = new RedisClient(config);
    }

    public async init(): Promise<void> {
        try {
            await this.redisClient.connect();
            
            const isConnected = this.redisClient.isConnected();
            if (!isConnected) 
                throw new Error('Redis connection verification failed');
            
            logger.info('Redis service initialized and verified successfully');
        } catch (error) {
            logger.error('Redis service initialization failed:', error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        await this.redisClient.disconnect();
        logger.info('Redis service shutdown');
    }

    public async getContractList(exchange: string): Promise<Array<string>> {
        try {
            const list = (await this.redisClient.hGetJson(keys.contractList, exchange)) as {contracts: Array<string>};
            if (!list || !list.contracts)
                return [];
            return list.contracts;
        }
        catch(err) {
            logger.error('Failed to get futures list from Redis:', err);
            throw err;
        }
    }

    public async getContractInfo(contract: string): Promise<any> {
        try {
            return this.redisClient.hGetJson(keys.contractInfo, contract);
        }
        catch (err) {
            throw err;
        }
    }

    public async getSubjectAssets(exchange: string): Promise<any> {
        try {
            const names = await this.redisClient.sMembers(keys.contractAssets + ":" + exchange);
            let ret: {name: string, code: string}[] = [];
            for (const n of names) {
                ret.push({name: n, code: (await this.redisClient.hGet(keys.contractAssetCodes, n)) as string})
            }
            return ret;
        }
        catch (err) {
            throw err;
        }
    }
    
    public async initFuturesContractInfo(data: any, exchange: string): Promise<void> {
        try {
            let list: Array<string> = [];
            for (let item of data.items) {
                this.redisClient.hSetJson(keys.contractInfo, item[0] as string, item);
                list.push(item[0] as string);
                let assetName = (item[3] as string).replace(/TAS$/, '').replace(/连续$/, '').replace(/主力$/, '').replace(/\d+$/, '');
                this.redisClient.sAdd(keys.contractAssets + ":" + exchange, assetName);
                this.redisClient.hSet(keys.contractAssetCodes, assetName, item[4] as string);
            }
            this.redisClient.hSetJson(keys.contractList, exchange, {"contracts": list});
        }
        catch(err) {
            logger.error('Failed to initialize futures contract info in Redis:', err);
            throw err;
        }
    }

    public async updateFuturesContractInfo(data: any, exchange: string): Promise<void> {
        try {
            let list = await this.redisClient.hGetJson(keys.contractList, exchange);
            let names: Array<string> = await this.redisClient.sMembers(keys.contractAssets + ":" + exchange);
            for (let item of data.items) {
                this.redisClient.hSetJson(keys.contractInfo, item[0] as string, item);
                list.contracts.push(item[0] as string);
                const assetName = (item[3] as string).replace(/TAS$/, '').replace(/连续$/, '').replace(/主力$/, '').replace(/\d+$/, '');
                if (!names.includes(assetName)) {
                    this.redisClient.sAdd(keys.contractAssets + ":" + exchange, assetName);
                    this.redisClient.hSet(keys.contractAssetCodes, assetName, item[4] as string);
                }
            }
            this.redisClient.hSetJson(keys.contractList, exchange, list);
        }
        catch(err) {
            logger.error('Failed to update futures contract info in Redis:', err);
            throw err;
        }
    }

    public async setContractsUpdated(date: string) {
        this.redisClient.set(keys.contractUpdateDate, date);
    }

    public async getUpdateTime(): Promise<string|null> {
        return await this.redisClient.get(keys.contractUpdateDate);
    }

    // 缓存API响应
    public async cacheApiResponse(endpoint: string, params: any, data: any, ttl: number = 300): Promise<void> {
        try {
            const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
            await this.redisClient.setJson(cacheKey, data, ttl);
            logger.info(`Cached API response for ${endpoint}`);
        } catch (error) {
            logger.error('Failed to cache API response:', error);
            throw error;
        }
    }

    // 获取缓存的API响应
    public async getCachedApiResponse(endpoint: string, params: any): Promise<any> {
        try {
            const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
            const data = await this.redisClient.getJson(cacheKey);
            return data;
        } catch (error) {
            logger.error('Failed to get cached API response:', error);
            throw error;
        }
    }

    // 存储用户会话数据
    public async storeSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
        try {
            await this.redisClient.setJson(`session:${sessionId}`, data, ttl);
        } catch (error) {
            logger.error('Failed to store session:', error);
            throw error;
        }
    }

    // 获取用户会话数据
    public async getSession(sessionId: string): Promise<any> {
        try {
            return await this.redisClient.getJson(`session:${sessionId}`);
        } catch (error) {
            logger.error('Failed to get session:', error);
            throw error;
        }
    }

    public async deleteSession(sessionId: string): Promise<void> {
        try {
            await this.redisClient.del(`session:${sessionId}`);
        } catch (error) {
            logger.error('Failed to delete session:', error);
            throw error;
        }
    }

    public async healthCheck(): Promise<boolean> {
        try {
            return this.redisClient.isConnected();
        } catch (error) {
            logger.error('Redis health check failed:', error);
            return false;
        }
    }

    public async flush(): Promise<void> {
        try {
            this.redisClient.flushDb();
        } catch (e) {
            logger.error(`Flush DB failed, error: ${e}`);
        }
    }

    // Cleanup expired keys (if needed)
    public async cleanup(): Promise<void> {
        try {
            // Redis会自动清理过期的键，这里可以添加额外的清理逻辑
            logger.info('Redis cleanup completed');
        } catch (error) {
            logger.error('Redis cleanup failed:', error);
            throw error;
        }
    }
}

export default RedisService;
