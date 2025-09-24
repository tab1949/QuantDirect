import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/index';
import logger from './logger';

const app = express();
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

app.listen(port, () => {
  logger.info(`Server listening on port ${port} (API base: ${API_BASE})`);
});
