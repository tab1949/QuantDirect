import * as redisService from "./redisFetchService";

export async function getContractsList(exchange: string) {
  let list = await redisService.getContractsList(exchange);
  return list.contractList;
}

export async function getContractBySymbol(symbol: string) {
  return redisService.getContractInfo(symbol);
}
