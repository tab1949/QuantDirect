import * as redisService from "./redisFetchService";

export async function getContractsList(exchange: string) {
  return redisService.getContractsList(exchange);
}

export async function getContractBySymbol(symbol: string) {
  return redisService.getContractInfo(symbol);
}
