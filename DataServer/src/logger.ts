import log4js from 'log4js';

const logLevel = process.env.LOG_LEVEL || 'info';

log4js.configure({
  appenders: {
    console: { type: 'console' },
    main: { type: 'file', filename: 'log/main.log' },
    redis: { type: 'file', filename: 'log/redis.log' },
    database: { type: 'file', filename: 'log/database.log' },
    futures: { type: 'file', filename: 'log/futures.log' },
    futures_service: { type: 'file', filename: 'log/futures_service.log' },
    stock: { type: 'file', filename: 'log/stock.log' },
    stock_service: { type: 'file', filename: 'log/stock_service.log' },
    backup: { type: 'file', filename: 'log/backup.log' },
    routes: { type: 'file', filename: 'log/routes.log' },
    default: { type: 'file', filename: 'log/default.log' }
  },
  categories: {
    main: { appenders: ['console', 'main'], level: logLevel },
    redis: { appenders: ['console', 'redis'], level: logLevel },
    database: { appenders: ['console', 'database'], level: logLevel },
    futures: { appenders: ['console', 'futures'], level: logLevel },
    futures_service: { appenders: ['console', 'futures_service'], level: logLevel },
    stock: { appenders: ['console', 'stock'], level: logLevel },
    stock_service: { appenders: ['console', 'stock_service'], level: logLevel },
    backup: { appenders: ['console', 'backup'], level: logLevel },
    routes: { appenders: ['console', 'routes'], level: logLevel },
    default: { appenders: ['console', 'default'], level: logLevel }
  }
});

export function getLogger(category?: string) {
  return log4js.getLogger(category);
}

export default log4js.getLogger('default');
