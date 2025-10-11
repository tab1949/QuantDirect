import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/index';
import logger from './logger';
import dataService from './database/dataService';
import setDataSource from './services/redisFetchService';
import config from './config.json';

const app = express();
const data = dataService(config);
setDataSource(data);
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
// Allow overriding API base path via env
const API_BASE = process.env.API_BASE || '/api';

app.use(cors());
app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await data.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      message: 'Service unavailable - Redis connection failed',
      ts: new Date().toISOString() 
    });
  }
});

// simple echo endpoint kept for convenience
app.get(`${API_BASE}/echo`, (req: Request, res: Response) => {
  const q = req.query.q || null;
  res.json({ echo: q });
});

// Mount consolidated API router (routes/index.ts handles subpaths)
app.use(API_BASE, apiRouter);


logger.info('Starting server initialization...');

logger.info('Initializing data service and Redis connection...');
data.run()
.then(() => {
  logger.info('Data service and Redis initialized successfully');
})
.catch((e) => {
  logger.info(`Start data service failed: ${e}`);
});

app.listen(port, () => {
  logger.info(`Server listening on port ${port} (API base: ${API_BASE})`);
  logger.info('Server startup completed successfully');
});


process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    await data.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  try {
    await data.stop();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});