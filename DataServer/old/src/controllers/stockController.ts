import { Request, Response } from 'express';
import * as stockService from '../services/stockService';

export async function list(req: Request, res: Response) {
  const data = await stockService.getStockList();
  res.json(data);
}

export async function getBySymbol(req: Request, res: Response) {
  const { symbol } = req.params;
  const item = await stockService.getStockBySymbol(symbol);
  res.json(item);
}
