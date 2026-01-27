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
  WebCtpTradeAuthInstruction,
  WebCtpTradeConnectFrontInstruction,
  WebCtpTradeConnectInstruction,
  WebCtpTradeDeleteOrderInstruction,
  WebCtpTradeInsertOrderInstruction,
  WebCtpTradeLoginInstruction,
  WebCtpTradeSetInstruction,
  WebCtpTradeQueryInstrumentInstruction,
  WebCtpTradeQueryOrderInstruction,
} from "./types";

export interface QDEngineClientOptions {
  onReport?: ReportHandler;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export class QDEngineClient {
  private ws?: WebSocket;
  private authenticated = false;
  private pendingConnect?: { resolve: () => void; reject: (reason?: unknown) => void };
  private readonly onReport?: ReportHandler;
  private readonly onClose?: (event: CloseEvent) => void;
  private readonly onError?: (event: Event) => void;

  constructor(options?: QDEngineClientOptions) {
    this.onReport = options?.onReport;
    this.onClose = options?.onClose;
    this.onError = options?.onError;
  }

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
          this.handleReport(report);
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

  private handleReport(report: Report): void {
    if (report.code === ReportCode.Handshake) {
      const data = report.data as HandshakeInstruction;
      this.sendInstruction("Handshake", { token: data.token });
      return;
    }

    if (!this.authenticated && report.code === ReportCode.Success) {
      this.authenticated = true;
      this.pendingConnect?.resolve();
      this.pendingConnect = undefined;
    } else if (!this.authenticated && report.code === ReportCode.AuthenticateFailed) {
      this.pendingConnect?.reject(new Error(`Authentication failed: ${report.message}`));
      this.pendingConnect = undefined;
      this.ws?.close();
      return;
    }

    this.onReport?.(report);
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

  private sendInstruction<T extends InstructionAction>(action: T, data: InstructionPayloads[T]): void {
    const ws = this.ensureReady(action);
    const payload = { action, data };
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
