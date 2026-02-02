/*
 * Lightweight WebSocket client for QDEngine.
 * Mirrors QDEngine server instructions and reports defined in the Rust backend.
 */

import {
  HandshakeInstruction,
  InstructionAction,
  InstructionPayloads,
  Report,
  ReportCode,
  ReportHandler,
  TestRequestInstruction,
  WebCtpMarketDataConnectFrontInstruction,
  WebCtpMarketDataConnectInstruction,
  WebCtpMarketDataLoginInstruction,
  WebCtpMarketDataDisconnectInstruction,
  WebCtpMarketDataSubscribeInstruction,
  WebCtpMarketDataUnsubscribeInstruction,
  WebCtpMarketDataTradingDayInstruction,
  WebCtpTradeAuthInstruction,
  WebCtpTradeConnectFrontInstruction,
  WebCtpTradeConnectInstruction,
  WebCtpTradeDeleteOrderInstruction,
  WebCtpTradeInsertOrderInstruction,
  WebCtpTradeLoginInstruction,
  WebCtpTradeSetInstruction,
  WebCtpTradeQueryInstrumentInstruction,
  WebCtpTradeQueryOrderInstruction,
  WebCtpTradeConfirmSettlementInfoInstruction,
  WebCtpTradeDisconnectInstruction,
  WebCtpTradeLogoutInstruction,
  WebCtpTradeQuerySettlementInfoInstruction,
  WebCtpTradeQueryTradingAccountInstruction,
  WebCtpTradeTradingDayInstruction,
  WebCtpMessage
} from "./types";

export class QDEngineClient {
  private ws?: WebSocket;
  private authenticated = false;
  private pendingConnect?: { 
    resolve: () => void; 
    reject: (reason?: unknown) => void 
  };

  private onReport: ReportHandler = (r: Report) => {
    switch (r.code) {
      case ReportCode.AuthenticateFailed:
        if (!this.authenticated) {
          this.pendingConnect?.reject(new Error(`Authentication failed: ${r.message}`));
          this.pendingConnect = undefined;
          this.ws?.close();
          break;
        }
        break;
      case ReportCode.GeneralError:
        this.onErrorReport?.(r);
        break;
      case ReportCode.Success:
        if (!this.authenticated) {
          this.authenticated = true;
          this.pendingConnect?.resolve();
          this.pendingConnect = undefined;
          break;
        }
        this.onSuccessReport?.(r);
        break;
      case ReportCode.Handshake:
        const data = r.data as HandshakeInstruction;
        this.sendInstruction("Handshake", { token: data.token });
        break;
      case ReportCode.WebCtpMarketDataEvent:
        switch (WebCtpMessage.MDMsgMap[r.data.event]) {
          case WebCtpMessage.MDMsgCode.PERFORMED:
            this.onMdPerformed?.({
              ErrorCode: r.data.payload.err.code,
              Message:   r.data.payload.err.msg || "",
              RequestID: r.data.payload.info.req_id,
            });
            break;
          case WebCtpMessage.MDMsgCode.ERROR:
            this.onMdError?.(r.data.payload, r.data.payload as WebCtpMessage.ErrorMessage);
            break;
          case WebCtpMessage.MDMsgCode.CONNECTED:
            this.onMdConnected?.();
            break;
          case WebCtpMessage.MDMsgCode.DISCONNECTED:
            this.onMdDisconnected?.(r.data.payload.info.reason);
            break;
          case WebCtpMessage.MDMsgCode.LOGIN:
            this.onMdLogin?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.MDMsgCode.LOGOUT:
            this.onMdLogout?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.MDMsgCode.TRADING_DAY:
            this.onMdTradingDay?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.MDMsgCode.HEARTBEAT_TIMEOUT:
            this.onMdHeartbeatTimeout?.(r.data.payload.info.time);
            break;
          case WebCtpMessage.MDMsgCode.SUBSCRIBE:
            this.onMdSubscribe?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.MDMsgCode.UNSUBSCRIBE:
            this.onMdUnsubscribe?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.MDMsgCode.MARKET_DATA:
            this.onMdMarketData?.(r.data.payload.err, r.data.payload.info);
            break;
        }
        break;
      case ReportCode.WebCtpTradeEvent:
        switch (WebCtpMessage.TradeMsgMap[r.data.event]) {
          case WebCtpMessage.TradeMsgCode.PERFORMED:
            this.onTradePerformed?.({
              ErrorCode: r.data.payload.err.code,
              Message:   r.data.payload.err.msg || "",
              RequestID: r.data.payload.info.req_id,
            });
            break;
          case WebCtpMessage.TradeMsgCode.ERROR:
            this.onTradeError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ERROR_NULL:
            break;
          case WebCtpMessage.TradeMsgCode.ERROR_UNKNOWN_VALUE:
            this.onTradeUnknownValueError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.CONNECTED:
            this.onTradeConnected?.();
            break;
          case WebCtpMessage.TradeMsgCode.DISCONNECTED:
            this.onTradeDisconnected?.(r.data.payload.err);
            break;
          case WebCtpMessage.TradeMsgCode.AUTHENTICATE:
            this.onTradeAuthenticate?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.TRADING_DAY:
            this.onTradeTradingDay?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.LOGIN:
            this.onTradeLogin?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.LOGOUT:
            this.onTradeLogout?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.TRADING_ACCOUNT:
            this.onTradeTradingAccount?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.SETTLEMENT_INFO:
            this.onTradeSettlementInfo?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.SETTLEMENT_INFO_CONFIRM:
            this.onTradeSettlementInfoConfirm?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.QUERY_INSTRUMENT:
            this.onTradeQueryInstrument?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.QUERY_ORDER:
            this.onTradeQueryOrder?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_INSERTED:
            this.onTradeOrderInserted?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_INSERT_ERROR:
            this.onTradeOrderInsertError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_INSERT_RETURN_ERROR:
            this.onTradeOrderInsertReturnError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_DELETED:
            this.onTradeOrderDeleted?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_DELETE_ERROR:
            this.onTradeOrderDeleteError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_DELETE_RETURN_ERROR:
            this.onTradeOrderDeleteReturnError?.(r.data.payload.err, r.data.payload.info);
            break;
          case WebCtpMessage.TradeMsgCode.ORDER_TRADED:
            this.onTradeOrderTraded?.(r.data.payload.err, r.data.payload.info);
            break;
        }
        break;
      case ReportCode.WebCtpOperationAck:
        this.onWebCTPAck?.(r);
        break;
    }
  };
  onMdPerformed?: (err: WebCtpMessage.Performed) => void;
  onMdError?: (err: WebCtpMessage.ErrorInfo | null, msg: WebCtpMessage.ErrorMessage) => void;
  onMdConnected?: () => void;
  onMdDisconnected?: (reason: number) => void;
  onMdLogin?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MdLogin | WebCtpMessage.ErrorMessage) => void;
  onMdLogout?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MdLogout | WebCtpMessage.ErrorMessage) => void;
  onMdTradingDay?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MdTradingDay) => void;
  onMdHeartbeatTimeout?: (time: number) => void;
  onMdSubscribe?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MdSubscribe | WebCtpMessage.ErrorMessage) => void;
  onMdUnsubscribe?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MdUnsubscribe | WebCtpMessage.ErrorMessage) => void;
  onMdMarketData?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.MarketData | null) => void;

  onTradePerformed?: (err: WebCtpMessage.Performed) => void;
  onTradeError?: (err: WebCtpMessage.ErrorInfo | null, msg: WebCtpMessage.ErrorMessage) => void;
  onTradeUnknownValueError?: (err: WebCtpMessage.ErrorInfo | null, info: any) => void;
  onTradeConnected?: () => void;
  onTradeDisconnected?: (err: WebCtpMessage.ErrorInfo | null) => void;
  onTradeAuthenticate?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.TradeAuthenticate | WebCtpMessage.ErrorMessage) => void;
  onTradeTradingDay?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.TradeTradingDay) => void;
  onTradeLogin?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.TradeLogin | WebCtpMessage.ErrorMessage) => void;
  onTradeLogout?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.TradeLogout | WebCtpMessage.ErrorMessage) => void;
  onTradeSettlementInfo?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.SettlementInfo | WebCtpMessage.ErrorMessage) => void;
  onTradeSettlementInfoConfirm?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.SettlementInfoConfirm | WebCtpMessage.ErrorMessage) => void;
  onTradeTradingAccount?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.TradingAccount | WebCtpMessage.ErrorMessage) => void;
  onTradeOrderInserted?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderInserted | null) => void;
  onTradeOrderInsertError?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderInsertError | WebCtpMessage.ErrorMessage) => void;
  onTradeOrderInsertReturnError?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderInsertReturnError | null) => void;
  onTradeOrderDeleted?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderDeleted | null) => void;
  onTradeOrderDeleteError?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderDeleteError | WebCtpMessage.ErrorMessage) => void;
  onTradeOrderDeleteReturnError?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderDeleteReturnError | null) => void;
  onTradeOrderTraded?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.OrderTraded | null) => void;
  onTradeQueryOrder?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.QueryOrder | WebCtpMessage.ErrorMessage) => void;
  onTradeQueryInstrument?: (err: WebCtpMessage.ErrorInfo | null, info: WebCtpMessage.Instrument | WebCtpMessage.ErrorMessage) => void;

  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onErrorReport?: (report: Report) => void;
  onSuccessReport?: (report: Report) => void;
  onWebCTPAck?: (report: Report) => void;

  async connect(host: string, port: number): Promise<void> {
    await this.disconnect();
    const url = `ws://${host}:${port}/`;

    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.pendingConnect = { resolve, reject };
      this.ws = ws;
      this.authenticated = false;

      ws.onopen = () => {
        // Waiting for handshake report from server.
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        const text = event.data;
        try {
          const report: Report = JSON.parse(text);
          console.log("Received report:", report);
          this.onReport(report);
        } catch (err) {
          reject(err);
          ws.close();
        }
      };

      ws.onerror = (event) => {
        this.pendingConnect?.reject(event);
        this.onError?.(event);
      };

      ws.onclose = (event) => {
        this.authenticated = false;
        if (this.pendingConnect) {
          this.pendingConnect.reject(new Error(`Connection closed during handshake: ${event.reason || event.code}`));
          this.pendingConnect = undefined;
        }
        this.onClose?.(event);
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = undefined;
    this.authenticated = false;
    return Promise.resolve();
  }

  private ensureReady(action: InstructionAction): WebSocket {
    if (!this.ws) {
      throw new Error("WebSocket is not connected.");
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection is not open.");
    }
    if (!this.authenticated && action !== "Handshake") {
      throw new Error("WebSocket handshake not finished yet.");
    }
    return this.ws;
  }

  public ready(): boolean {
    // console.log("Checking ready state:", this.ws, this.ws?.readyState, this.authenticated);
    return this.ws !== undefined && this.ws.readyState === WebSocket.OPEN && this.authenticated;
  }

  private sendInstruction<T extends InstructionAction>(action: T, data: InstructionPayloads[T]): void {
    const ws = this.ensureReady(action);
    const payload = { action, data };
    console.log("Sending instruction:", payload);
    ws.send(JSON.stringify(payload));
  }

  // Back-test APIs
  requestBacktest(data: TestRequestInstruction): void {
    this.sendInstruction("TestRequest", data);
  }

  cancelBacktest(reference: number): void {
    this.sendInstruction("TestCancel", { reference });
  }

  queryBacktest(reference: number): void {
    this.sendInstruction("TestQuery", { reference });
  }

  // WebCTP market data APIs
  webCtpMarketDataConnect(data: WebCtpMarketDataConnectInstruction): void {
    this.sendInstruction("WebCtpMarketDataConnect", data);
  }

  webCtpMarketDataConnectFront(data: WebCtpMarketDataConnectFrontInstruction): void {
    this.sendInstruction("WebCtpMarketDataConnectFront", data);
  }

  webCtpMarketDataLogin(data: WebCtpMarketDataLoginInstruction): void {
    this.sendInstruction("WebCtpMarketDataLogin", data);
  }

  webCtpMarketDataSubscribe(instruments: string[]): void {
    this.sendInstruction("WebCtpMarketDataSubscribe", { instruments });
  }

  webCtpMarketDataUnsubscribe(instruments: string[]): void {
    this.sendInstruction("WebCtpMarketDataUnsubscribe", { instruments });
  }

  webCtpMarketDataTradingDay(): void {
    this.sendInstruction("WebCtpMarketDataTradingDay", {});
  }

  webCtpMarketDataDisconnect(): void {
    this.sendInstruction("WebCtpMarketDataDisconnect", {});
  }

  // WebCTP trade APIs
  webCtpTradeConnect(data: WebCtpTradeConnectInstruction): void {
    this.sendInstruction("WebCtpTradeConnect", data);
  }

  webCtpTradeConnectFront(data: WebCtpTradeConnectFrontInstruction): void {
    this.sendInstruction("WebCtpTradeConnectFront", data);
  }

  webCtpTradeSet(data: WebCtpTradeSetInstruction): void {
    this.sendInstruction("WebCtpTradeSet", data);
  }

  webCtpTradeTradingDay(): void {
    this.sendInstruction("WebCtpTradeTradingDay", {});
  }

  webCtpTradeAuth(data: WebCtpTradeAuthInstruction): void {
    this.sendInstruction("WebCtpTradeAuth", data);
  }

  webCtpTradeLogin(data: WebCtpTradeLoginInstruction): void {
    this.sendInstruction("WebCtpTradeLogin", data);
  }

  webCtpTradeLogout(user_id: string): void {
    this.sendInstruction("WebCtpTradeLogout", { user_id });
  }

  webCtpTradeQuerySettlementInfo(trading_day: string): void {
    this.sendInstruction("WebCtpTradeQuerySettlementInfo", { trading_day });
  }

  webCtpTradeConfirmSettlementInfo(): void {
    this.sendInstruction("WebCtpTradeConfirmSettlementInfo", {});
  }

  webCtpTradeQueryTradingAccount(): void {
    this.sendInstruction("WebCtpTradeQueryTradingAccount", {});
  }

  webCtpTradeInsertOrder(data: WebCtpTradeInsertOrderInstruction): void {
    this.sendInstruction("WebCtpTradeInsertOrder", data);
  }

  webCtpTradeQueryOrder(filters: WebCtpTradeQueryOrderInstruction = {}): void {
    this.sendInstruction("WebCtpTradeQueryOrder", filters);
  }

  webCtpTradeDeleteOrder(data: WebCtpTradeDeleteOrderInstruction): void {
    this.sendInstruction("WebCtpTradeDeleteOrder", data);
  }

  webCtpTradeQueryInstrument(filters: WebCtpTradeQueryInstrumentInstruction = {}): void {
    this.sendInstruction("WebCtpTradeQueryInstrument", filters);
  }

  webCtpTradeDisconnect(): void {
    this.sendInstruction("WebCtpTradeDisconnect", {});
  }
}
