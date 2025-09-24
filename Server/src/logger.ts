import log4js from 'log4js';

log4js.configure({
  appenders: {
    out: { type: 'console' },
    app: { type: 'file', filename: 'logs/server.log' }
  },
  categories: {
    default: { appenders: ['out'], level: process.env.LOG_LEVEL || 'info' }
  }
});

const logger = log4js.getLogger();
export default logger;
