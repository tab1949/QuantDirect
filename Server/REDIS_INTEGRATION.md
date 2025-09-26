# Redis集成说明

本项目已成功集成Redis作为数据存储解决方案，用于缓存市场数据、期货列表和API响应。

## 功能特性

- ✅ Redis客户端连接管理
- ✅ 市场数据存储和检索
- ✅ 期货列表数据管理
- ✅ API响应缓存
- ✅ 会话管理
- ✅ 健康检查
- ✅ 自动重连机制
- ✅ 优雅关闭处理

## 安装和配置

### 1. 安装Redis依赖

```bash
npm install redis
```

### 2. 配置Redis连接

在 `src/config.json` 中配置Redis连接参数：

```json
{
    "redis": {
        "host": "localhost",
        "port": 6379,
        "password": "",
        "db": 0,
        "retryDelayOnFailover": 100,
        "enableReadyCheck": false,
        "maxRetriesPerRequest": null
    }
}
```

### 3. 启动Redis服务器

确保Redis服务器正在运行：

```bash
# 使用Docker启动Redis
docker run -d --name redis-server -p 6379:6379 redis:latest

# 或使用本地安装的Redis
redis-server
```

## 使用方法

### 基本使用

```typescript
import RedisService from './database/redisService';
import config from './config.json';

const redisService = new RedisService(config.redis);

// 初始化连接
await redisService.initialize();

// 存储数据
await redisService.storeMarketData(marketData, 'stocks');

// 获取数据
const data = await redisService.getMarketData('AAPL', 'stocks');

// 关闭连接
await redisService.shutdown();
```

### 市场数据存储

```typescript
const marketData = [
    {
        symbol: 'AAPL',
        price: 150.25,
        volume: 1000000,
        timestamp: Date.now(),
        exchange: 'NASDAQ'
    }
];

// 存储市场数据（1小时过期）
await redisService.storeMarketData(marketData, 'stocks');

// 获取特定股票数据
const stockData = await redisService.getMarketData('AAPL', 'stocks');

// 获取所有市场数据
const allData = await redisService.getMarketData(undefined, 'stocks');
```

### 期货列表管理

```typescript
const futuresData = [
    {
        ts_code: 'A2301.DCE',
        symbol: 'A2301',
        name: '豆粕2301',
        exchange: 'DCE',
        list_date: '20230101'
    }
];

// 存储期货列表（24小时过期）
await redisService.storeFuturesList(futuresData, 'DCE');

// 获取特定交易所的期货列表
const dceFutures = await redisService.getFuturesList('DCE');

// 获取所有期货列表
const allFutures = await redisService.getFuturesList();
```

### API响应缓存

```typescript
// 缓存API响应（5分钟过期）
await redisService.cacheApiResponse('stock/quote', { symbol: 'AAPL' }, responseData, 300);

// 获取缓存的响应
const cachedResponse = await redisService.getCachedApiResponse('stock/quote', { symbol: 'AAPL' });
```

### 会话管理

```typescript
// 存储用户会话（1小时过期）
await redisService.storeSession('session123', userData, 3600);

// 获取会话数据
const sessionData = await redisService.getSession('session123');

// 删除会话
await redisService.deleteSession('session123');
```

## 数据存储结构

### Redis键命名规范

- `market:{timestamp}` - 市场数据历史记录
- `market:realtime:{symbol}` - 实时市场数据
- `futures:list:{exchange}` - 期货列表
- `futures:detail:{ts_code}` - 期货详情
- `api:{endpoint}:{params}` - API响应缓存
- `session:{sessionId}` - 用户会话

### 数据过期时间

- 市场数据：1小时
- 实时数据：5分钟
- 期货列表：24小时
- API缓存：5分钟（可配置）
- 会话数据：1小时（可配置）

## 错误处理

所有Redis操作都包含错误处理机制：

```typescript
try {
    await redisService.storeMarketData(data);
} catch (error) {
    console.error('存储失败:', error);
}
```

## 健康检查

```typescript
const isHealthy = await redisService.healthCheck();
console.log('Redis状态:', isHealthy ? '正常' : '异常');
```

## 性能优化建议

1. **连接池管理**: Redis客户端自动管理连接池
2. **数据压缩**: 大型JSON数据建议压缩后存储
3. **批量操作**: 使用批量操作减少网络往返
4. **监控**: 定期检查Redis内存使用情况
5. **备份**: 定期备份重要数据

## 故障排除

### 常见问题

1. **连接失败**
   - 检查Redis服务器是否运行
   - 验证连接配置参数
   - 检查网络连接

2. **内存不足**
   - 调整Redis最大内存限制
   - 优化数据过期时间
   - 清理无用数据

3. **性能问题**
   - 监控Redis性能指标
   - 优化数据结构
   - 考虑使用Redis集群

## 开发示例

查看 `src/examples/redisUsage.ts` 文件获取完整的使用示例。

## 注意事项

- 确保Redis服务器在生产环境中正确配置
- 定期监控Redis内存使用情况
- 备份重要的缓存数据
- 在生产环境中使用Redis密码认证
