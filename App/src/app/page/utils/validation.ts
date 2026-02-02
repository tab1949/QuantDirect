import type { AppSettings } from "../../../types/settings";

const OCTET_REGEX = /(25[0-5]|2[0-4]\d|1?\d?\d)/;
const IPV4_REGEX = new RegExp(`^${OCTET_REGEX.source}\.${OCTET_REGEX.source}\.${OCTET_REGEX.source}\.${OCTET_REGEX.source}$`);

export const isValidIpv4 = (value: string): boolean => IPV4_REGEX.test(value.trim());

export const isValidPort = (value: string | number): boolean => {
  const port = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isInteger(port)) {
    return false;
  }
  return port >= 1 && port <= 65535;
};

export const normalizePort = (value: unknown): number | null => {
  const port = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isInteger(port)) {
    return null;
  }
  return port >= 1 && port <= 65535 ? port : null;
};

export const normalizeTradingAccount = (
  value: unknown
): AppSettings["tradingAccount"] => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<AppSettings["tradingAccount"]>;
  const alias = typeof maybe?.alias === "string" ? maybe.alias.trim() : "";
  const userId = typeof maybe?.user_id === "string" ? maybe.user_id.trim() : "";
  const brokerId = typeof maybe?.broker_id === "string" ? maybe.broker_id.trim() : "";
  const tradeAddr = typeof maybe?.front_trade_addr === "string" ? maybe.front_trade_addr.trim() : "";
  const marketAddr = typeof maybe?.front_market_data_addr === "string" ? maybe.front_market_data_addr.trim() : "";
  const tradePort = normalizePort(maybe?.front_trade_port);
  const marketPort = normalizePort(maybe?.front_market_data_port);

  if (!userId || !brokerId || !tradeAddr || !marketAddr || tradePort === null || marketPort === null) {
    return null;
  }

  if (!isValidIpv4(tradeAddr) || !isValidIpv4(marketAddr)) {
    return null;
  }

  return {
    alias: alias || userId,
    user_id: userId,
    broker_id: brokerId,
    front_trade_addr: tradeAddr,
    front_trade_port: tradePort,
    front_market_data_addr: marketAddr,
    front_market_data_port: marketPort
  };
};
