/*
 * Shared type definitions for QDEngine WebSocket client.
 */

export enum ReportCode {
  AuthenticateFailed = -2,
  GeneralError = -1,
  Success = 0,
  Handshake = 1,
  WebCtpMarketDataEvent = 2,
  WebCtpTradeEvent = 3,
  WebCtpOperationAck = 4,
}

export type Report<T = unknown> = {
  code: ReportCode;
  message: string;
  data: T;
};

export type HandshakeInstruction = { token: string };

export type TestRequestInstruction = {
  market: "Futures" | "FuturesOptions" | "StockCN" | "StockHK" | "StockUS";
  time_begin: string;
  time_end: string;
};

export type TestCancelInstruction = { reference: number };

export type TestQueryInstruction = { reference: number };

export type WebCtpMarketDataConnectInstruction = {
  addr: string;
  port: number;
  broker_id: string;
  user_id: string;
};

export type WebCtpMarketDataConnectFrontInstruction = {
  addr: string;
  port: number;
};

export type WebCtpMarketDataLoginInstruction = { password: string };

export type WebCtpMarketDataSubscribeInstruction = { instruments: string[] };

export type WebCtpMarketDataUnsubscribeInstruction = { instruments: string[] };

export type WebCtpMarketDataTradingDayInstruction = Record<string, never>;

export type WebCtpMarketDataDisconnectInstruction = Record<string, never>;

export type WebCtpTradeConnectInstruction = {
  addr: string;
  port: number;
  broker_id: string;
  investor_id: string;
};

export type WebCtpTradeConnectFrontInstruction = {
  addr: string;
  port: number;
};

export type WebCtpTradeSetInstruction = {
  broker_id?: string;
  investor_id?: string;
};

export type WebCtpTradeTradingDayInstruction = Record<string, never>;

export type WebCtpTradeAuthInstruction = {
  user_id: string;
  app_id: string;
  auth_code: string;
};

export type WebCtpTradeLoginInstruction = {
  user_id: string;
  password: string;
};

export type WebCtpTradeLogoutInstruction = {
  user_id: string;
};

export type WebCtpTradeQuerySettlementInfoInstruction = {
  trading_day: string;
};

export type WebCtpTradeConfirmSettlementInfoInstruction = Record<string, never>;

export type WebCtpTradeQueryTradingAccountInstruction = Record<string, never>;

export type WebCtpTradeInsertOrderInstruction = {
  instrument: string;
  exchange: string;
  reference: string;
  price: number;
  direction: number;
  offset: number;
  volume: number;
  price_type: number;
  time_condition: number;
};

export type WebCtpTradeQueryOrderInstruction = {
  order_sys_id?: string;
  exchange_id?: string;
  from?: string;
  to?: string;
};

export type WebCtpTradeDeleteOrderInstruction = {
  exchange: string;
  instrument: string;
  delete_ref: number;
  order_sys_id: string;
};

export type WebCtpTradeQueryInstrumentInstruction = {
  exchange?: string;
  instrument?: string;
  exchange_inst_id?: string;
  product_id?: string;
};

export type WebCtpTradeDisconnectInstruction = Record<string, never>;

export type InstructionPayloads = {
  Handshake: HandshakeInstruction;
  TestRequest: TestRequestInstruction;
  TestCancel: TestCancelInstruction;
  TestQuery: TestQueryInstruction;
  WebCtpMarketDataConnect: WebCtpMarketDataConnectInstruction;
  WebCtpMarketDataConnectFront: WebCtpMarketDataConnectFrontInstruction;
  WebCtpMarketDataLogin: WebCtpMarketDataLoginInstruction;
  WebCtpMarketDataSubscribe: WebCtpMarketDataSubscribeInstruction;
  WebCtpMarketDataUnsubscribe: WebCtpMarketDataUnsubscribeInstruction;
  WebCtpMarketDataTradingDay: WebCtpMarketDataTradingDayInstruction;
  WebCtpMarketDataDisconnect: WebCtpMarketDataDisconnectInstruction;
  WebCtpTradeConnect: WebCtpTradeConnectInstruction;
  WebCtpTradeConnectFront: WebCtpTradeConnectFrontInstruction;
  WebCtpTradeSet: WebCtpTradeSetInstruction;
  WebCtpTradeTradingDay: WebCtpTradeTradingDayInstruction;
  WebCtpTradeAuth: WebCtpTradeAuthInstruction;
  WebCtpTradeLogin: WebCtpTradeLoginInstruction;
  WebCtpTradeLogout: WebCtpTradeLogoutInstruction;
  WebCtpTradeQuerySettlementInfo: WebCtpTradeQuerySettlementInfoInstruction;
  WebCtpTradeConfirmSettlementInfo: WebCtpTradeConfirmSettlementInfoInstruction;
  WebCtpTradeQueryTradingAccount: WebCtpTradeQueryTradingAccountInstruction;
  WebCtpTradeInsertOrder: WebCtpTradeInsertOrderInstruction;
  WebCtpTradeQueryOrder: WebCtpTradeQueryOrderInstruction;
  WebCtpTradeDeleteOrder: WebCtpTradeDeleteOrderInstruction;
  WebCtpTradeQueryInstrument: WebCtpTradeQueryInstrumentInstruction;
  WebCtpTradeDisconnect: WebCtpTradeDisconnectInstruction;
};

export type InstructionAction = keyof InstructionPayloads;

export type ReportHandler = (report: Report) => void;
