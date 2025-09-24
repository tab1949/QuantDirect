import { Request, Response } from 'express';
import * as futuresService from '../services/futuresService';

export async function list(req: Request, res: Response) {
  const data = await futuresService.getFuturesList();
  res.json(data);
}

export async function getBySymbol(req: Request, res: Response) {
  const { symbol } = req.params;
  const item = await futuresService.getFutureBySymbol(symbol);
  res.json(item);
}
