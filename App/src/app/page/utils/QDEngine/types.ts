/*
 * Shared type definitions for QDEngine WebSocket client.
 */
export * as WebCtpMessage from "./webctp/message";

export enum ReportCode {
  AuthenticateFailed = -2,
  GeneralError = -1,
  Success = 0,
  Handshake = 1,
  WebCtpMarketDataEvent = 2,
  WebCtpTradeEvent = 3,
  WebCtpOperationAck = 4,
}

export type Report = {
  code: ReportCode;
  message: string;
  data: any;
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
  url: string;
  broker_id: string;
  user_id: string;
};

export type WebCtpMarketDataConnectFrontInstruction = {
  op_ref: string;
  addr: string;
  port: number;
};

export type WebCtpMarketDataLoginInstruction = { 
  op_ref: string;
  password: string;
};

export type WebCtpMarketDataSubscribeInstruction = { 
  op_ref: string;
  instruments: string[]; 
};

export type WebCtpMarketDataUnsubscribeInstruction = { 
  op_ref: string;
  instruments: string[];
};

export type WebCtpMarketDataTradingDayInstruction = {
  op_ref: string;
};

export type WebCtpMarketDataDisconnectInstruction = {

};

export type WebCtpTradeConnectInstruction = {
  url: string;
  broker_id: string;
  investor_id: string;
};

export type WebCtpTradeConnectFrontInstruction = {
  op_ref: string;
  addr: string;
  port: number;
};

export type WebCtpTradeSetInstruction = {
  op_ref: string;
  broker_id?: string;
  investor_id?: string;
};

export type WebCtpTradeTradingDayInstruction = { 
  op_ref: string 
};

export type WebCtpTradeAuthInstruction = {
  op_ref: string;
  user_id: string;
  app_id: string;
  auth_code: string;
};

export type WebCtpTradeLoginInstruction = {
  op_ref: string;
  user_id: string;
  password: string;
};

export type WebCtpTradeLogoutInstruction = {
  op_ref: string;
  user_id: string;
};

export type WebCtpTradeQuerySettlementInfoInstruction = {
  op_ref: string;
  trading_day: string;
};

export type WebCtpTradeConfirmSettlementInfoInstruction = {
  op_ref: string;
};

export type WebCtpTradeQueryTradingAccountInstruction = {
  op_ref: string;
};

export type WebCtpTradeInsertOrderInstruction = {
  op_ref: string;
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
  op_ref: string;
  order_sys_id?: string;
  exchange_id?: string;
  from?: string;
  to?: string;
};

export type WebCtpTradeDeleteOrderInstruction = {
  op_ref: string;
  exchange: string;
  instrument: string;
  delete_ref: number;
  order_sys_id: string;
};

export type WebCtpTradeQueryInstrumentInstruction = {
  op_ref: string;
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
