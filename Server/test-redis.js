/**
 * Redis集成测试脚本
 * 运行此脚本来测试Redis连接和基本功能
 */

const { createClient } = require('redis');
const config = require('./dist/config.json');

async function testRedisConnection() {
    console.log('开始测试Redis连接...');
    
    const client = createClient({
        socket: {
            host: config.redis.host,
            port: config.redis.port
        },
        password: config.redis.password || undefined,
        database: config.redis.db || 0
    });

    try {
        // 连接Redis
        await client.connect();
        console.log('✅ Redis连接成功');

        // 测试基本操作
        await client.set('test:key', 'Hello Redis!');
        const value = await client.get('test:key');
        console.log('✅ 基本读写测试成功:', value);

        // 测试JSON存储
        const testData = { message: 'Hello', timestamp: Date.now() };
        await client.set('test:json', JSON.stringify(testData));
        const jsonValue = JSON.parse(await client.get('test:json'));
        console.log('✅ JSON存储测试成功:', jsonValue);

        // 测试过期时间
        await client.setEx('test:expire', 5, 'This will expire in 5 seconds');
        console.log('✅ 过期时间设置成功');

        // 清理测试数据
        await client.del(['test:key', 'test:json', 'test:expire']);
        console.log('✅ 测试数据清理完成');

        console.log('🎉 所有Redis测试通过！');
        
    } catch (error) {
        console.error('❌ Redis测试失败:', error.message);
        console.log('\n请确保:');
        console.log('1. Redis服务器正在运行');
        console.log('2. 连接配置正确 (host, port, password)');
        console.log('3. 网络连接正常');
    } finally {
        await client.disconnect();
        console.log('Redis连接已关闭');
    }
}

// 运行测试
testRedisConnection().catch(console.error);
