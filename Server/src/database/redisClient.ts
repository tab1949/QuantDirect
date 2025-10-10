import { createClient, RedisClientType } from 'redis';
import logger from '../logger';

class RedisClient {
    private client: RedisClientType | null = null;
    private config: any;

    constructor(config: any) {
        this.config = config;
    }

    public async connect(): Promise<void> {
        try {
            this.client = createClient({
                socket: {
                    host: this.config.host,
                    port: this.config.port,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            logger.error('Redis connection failed after 10 retries');
                            return false;
                        }
                        logger.info(`Redis reconnecting (attempt ${retries})`);
                        return 1000;
                    }
                },
                password: this.config.password || undefined,
                database: this.config.db || 0
            });

            this.client.on('error', (err) => {
                // logger.error('Redis Client Error:', err);
            });

            this.client.on('connect', () => {
                logger.info('Redis client connected');
            });

            this.client.on('ready', () => {
                logger.info('Redis client ready');
            });

            this.client.on('end', () => {
                logger.info('Redis client disconnected');
            });

            await this.client.connect();
        } catch (error) {
            // logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }

    public async set(key: string, value: string, expireSeconds?: number): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        if (expireSeconds) {
            await this.client.setEx(key, expireSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    public async get(key: string): Promise<string | null> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.get(key);
    }

    public async del(key: string): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.del(key);
    }

    public async exists(key: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        const result = await this.client.exists(key);
        return result === 1;
    }

    public async hSet(key: string, field: string, value: string): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        await this.client.hSet(key, field, value);
    }

    public async hGet(key: string, field: string): Promise<string | undefined> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.hGet(key, field);
    }

    public async hGetAll(key: string): Promise<Record<string, string>> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.hGetAll(key);
    }

    public async hDel(key: string, field: string): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.hDel(key, field);
    }

    public async lPush(key: string, ...values: string[]): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.lPush(key, values);
    }

    public async rPush(key: string, ...values: string[]): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.rPush(key, values);
    }

    public async lRange(key: string, start: number, stop: number): Promise<string[]> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.lRange(key, start, stop);
    }

    public async lLen(key: string): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.lLen(key);
    }

    public async setJson(key: string, value: any, expireSeconds?: number): Promise<void> {
        const jsonString = JSON.stringify(value);
        await this.set(key, jsonString, expireSeconds);
    }

    public async hSetJson(key: string, field: string, value: any): Promise<void> {
        const jsonString = JSON.stringify(value);
        await this.hSet(key, field, jsonString);
    }

    public async getJson(key: string): Promise<any> {
        const jsonString = await this.get(key);
        if (jsonString) {
            return JSON.parse(jsonString);
        }
        return null;
    }

    public async hGetJson(key: string, field: string): Promise<any> {
        const jsonString = await this.hGet(key, field);
        if (jsonString) {
            return JSON.parse(jsonString);
        }
        return null;
    }

    public async keys(pattern: string): Promise<string[]> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        return await this.client.keys(pattern);
    }

    public async flushDb(): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not connected');
        }
        
        await this.client.flushDb();
    }

    public isConnected(): boolean {
        return this.client !== null && this.client.isReady;
    }
}

export default RedisClient;
