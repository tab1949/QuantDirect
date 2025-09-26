import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/index';
import logger from './logger';
import dataService from './database/dataService';
import config from './config.json';

const app = express();
const data = dataService(config);
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
// Allow overriding API base path via env
const API_BASE = process.env.API_BASE || '/api';

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// simple echo endpoint kept for convenience
app.get(`${API_BASE}/echo`, (req: Request, res: Response) => {
  const q = req.query.q || null;
  res.json({ echo: q });
});

// Mount consolidated API router (routes/index.ts handles subpaths)
app.use(API_BASE, apiRouter);

app.listen(port, async () => {
  logger.info(`Server listening on port ${port} (API base: ${API_BASE})`);
  
  try {
    await data.run();
  } catch (error) {
    logger.error('Failed to start data service:', error);
    process.exit(1);
  }
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