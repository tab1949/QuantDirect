import { Request, Response } from 'express';
import * as futuresService from '../services/futuresService';

export async function list(req: Request, res: Response) {
  const { symbol } = req.params;
  const data = await futuresService.getContractsList(symbol);
  res.json(data);
}

export async function getInfoBySymbol(req: Request, res: Response) {
  const { symbol } = req.params;
  if (req.query['g'] != null && req.query['e']) {
    res.json(await futuresService.getContractByAsset(symbol, <string>req.query['e']));
    return;
  }
  const item = await futuresService.getContractBySymbol(symbol.toUpperCase());
  res.json(item);
}

export async function getAssets(req: Request, res: Response) {
  const { exchange } = req.params;
  const data = await futuresService.getAssets(exchange);
  res.json(data);
}

export async function getFuturesData(req: Request, res: Response) {
  const { code } = req.params;
  const data = await futuresService.getFuturesData(code);
  if (data)
    res.json(data);
  else
    res.status(404).json({ error: `${code} not found` });
}