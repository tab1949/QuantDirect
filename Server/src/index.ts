import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from './routes/index';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json';
import logger from './logger';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
// allow overriding API base path via env (defaults to /api)
const API_BASE = process.env.API_BASE || '/api';

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// simple echo endpoint kept for convenience (mounted on API base)
app.get(`${API_BASE}/echo`, (req: Request, res: Response) => {
  const q = req.query.q || null;
  res.json({ echo: q });
});

// API docs (Swagger UI) - only expose when running in development
app.use(`${API_BASE}/docs`, (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).send('API docs are only available in development');
    return;
  }
  next();
}, swaggerUi.serve, swaggerUi.setup(openapi as any));

// Mount consolidated API router (routes/index.ts handles subpaths)
app.use(API_BASE, apiRouter);

app.listen(port, () => {
  logger.info(`MarketDirect server listening on port ${port} (API base: ${API_BASE})`);
});
