"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { AppSettings } from "../../../types/settings";
import TradingAccount from "./Account";
import { engineClient } from "../BasicLayout";
import { InlineT3 } from "../components/BasicLayout";
import { ReportCode, WebCtpMessage } from "../utils/engine";
import { log } from "node:console";

type TradingPageProps = {
  settings: AppSettings;
  settingsReady: boolean;
  darkMode: boolean;
  onChange: (patch: Partial<AppSettings>) => void;
};

const SIDEBAR_WIDTH = 280;

type LoginState = {
  isLoggedIn: boolean;
  timestamp: number;
};

let loginState: LoginState | null = null;

function InfoLine({label, value}: {label: string, value: any}) {
  return <div style={{ display: "flex", justifyContent: "space-between" }}><strong>{label}:</strong> <span>{value}</span></div>
}

export default function TradingPage({ settings, settingsReady, darkMode, onChange }: TradingPageProps) {
  const { t } = useTranslation();
  const [accountFormSignal, setAccountFormSignal] = useState<number>();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [stepStatus, setStepStatus] = useState<{color: string, info: string}>({color: "red", info: t("trading.status_not_logged_in")});
  const [showAccountInfo, setShowAccountInfo] = useState(true);
  const [loginStatus, setLoginStatus] = useState<boolean>(false);
  const [tradeLoginInfo, setTradeLoginInfo] = useState<WebCtpMessage.TradeLogin | null>(null);
  const [marketLoginInfo, setMarketLoginInfo] = useState<WebCtpMessage.MdLogin | null>(null);
  const [tradingAccountInfo, setTradingAccountInfo] = useState<WebCtpMessage.TradingAccount | null>(null);
  const accountInfoIntervalRef = useRef(null as any);
  const accountKeyRef = useRef<string>('');
  const hasCheckedLoginStateRef = useRef<boolean>(false);

  if (true) { // for dev
    if (engineClient) {
      engineClient.onClose = (event) => {
        console.log("QDEngine WebSocket closed:", event);
        setLoginStatus(false);
        setShowAccountInfo(true);
        loginState = null;
        if (accountInfoIntervalRef.current) {
          clearInterval(accountInfoIntervalRef.current);
        }
      };
      engineClient.onError = (event) => {
        console.error("QDEngine WebSocket error:", event);
        setLoginStatus(false);
        setShowAccountInfo(true);
        loginState = null;
        if (accountInfoIntervalRef.current) {
          clearInterval(accountInfoIntervalRef.current);
        }
      };
      engineClient.onWebCTPAck = (report) => {
        if (report.message == "webctp trade connected") {
          setStepStatus({color: "orange", info: t("trading.status_webctp_market")});
          engineClient?.webCtpMarketDataConnect({
            url: settings.marketDataEndpoint,
            broker_id: account?.broker_id || "",
            user_id: account?.user_id || ""
          });
          return;
        }
        if (report.message == "webctp market data connected") {
          setStepStatus({color: "orange", info: t("trading.status_ctp_trade")});
          engineClient?.webCtpTradeConnectFront({
            addr: account?.front_trade_addr || "",
            port: account?.front_trade_port || 0
          });
          return;
        }
      }

      engineClient.onMdConnected = () => {
        setStepStatus({color: "orange", info: t("trading.status_ctp_market_login")});
        engineClient?.webCtpMarketDataLogin({
          password: password
        });
      }
      engineClient.onMdLogin = (err, info) => {
        if (!err || err.code !== 0) {
          setStepStatus({color: "red", info: (err?.msg || "") + ` (${err?.code})`});
          setLoginStatus(false);
          loginState = null;
        } else {
          setShowAccountInfo(false);
          setLoginStatus(true);
          loginState = {isLoggedIn: true, timestamp: Date.now()};
          setMarketLoginInfo(info as WebCtpMessage.MdLogin);
          accountInfoIntervalRef.current = setInterval(() => {
            engineClient?.webCtpTradeQueryTradingAccount();
          }, 500);
        }
      }
      
      engineClient.onTradeConnected = () => {
        engineClient?.webCtpTradeSet({
          broker_id: account?.broker_id || "",
          investor_id: account?.user_id || ""
        });
        setStepStatus({color: "orange", info: t("trading.status_ctp_auth")});
        engineClient?.webCtpTradeAuth({
          app_id: settings.tradingAppId || "",
          auth_code: settings.tradingAuthCode || "",
          user_id: account?.user_id || ""
        });
      }
      engineClient.onTradeAuthenticate = () => {
        setStepStatus({color: "orange", info: t("trading.status_ctp_trade_login")});
        engineClient?.webCtpTradeLogin({
          user_id: account?.user_id || "",
          password: password
        });
      }
      engineClient.onTradeLogin = (err, info) => {
        if (!err || err.code === 0) {
          setStepStatus({color: "orange", info: t("trading.status_ctp_market")});
          engineClient?.webCtpMarketDataConnectFront({
            addr: account?.front_market_data_addr || "",
            port: account?.front_market_data_port || 0
          });
          setTradeLoginInfo(info as WebCtpMessage.TradeLogin);
          loginState = {isLoggedIn: true, timestamp: Date.now()};
        }
        else {
          setStepStatus({color: "red", info: (err?.msg || "") + ` (${err?.code})`});
          setLoginStatus(false);
          loginState = null;
        }
      }
      engineClient.onTradeLogout = (err, info) => {
        setLoginStatus(false);
        setShowAccountInfo(true);
        setStepStatus({color: "red", info: t("trading.status_not_logged_in")});
        loginState = null;
        if (accountInfoIntervalRef.current) {
          clearInterval(accountInfoIntervalRef.current);
        }
        engineClient?.webCtpTradeDisconnect();
      }
      engineClient.onTradeTradingAccount = (err, info) => {
        if (!err || err.code === 0) {
          setTradingAccountInfo(info as WebCtpMessage.TradingAccount);
        }
      }
    }
  }

  const account = settings.tradingAccount;
  const tradeEndpoint = account?.front_trade_addr
    ? `${account.front_trade_addr}${account.front_trade_port ? `:${account.front_trade_port}` : ""}`
    : "--";
  const marketEndpoint = account?.front_market_data_addr
    ? `${account.front_market_data_addr}${account.front_market_data_port ? `:${account.front_market_data_port}` : ""}`
    : "--";

  const currentAccountKey = account ? `${account.user_id}@${account.broker_id}` : '';

  useEffect(() => {
    if (accountKeyRef.current && currentAccountKey && accountKeyRef.current !== currentAccountKey) {
      loginState = null;
      setLoginStatus(false);
      setShowAccountInfo(true);
      setStepStatus({color: "red", info: t("trading.status_not_logged_in")});
      accountKeyRef.current = currentAccountKey;
      hasCheckedLoginStateRef.current = false;
    } else if (!accountKeyRef.current && currentAccountKey) {
      accountKeyRef.current = currentAccountKey;
    }
  }, [currentAccountKey, t]);

  useEffect(() => {
    if (!settingsReady || !account || hasCheckedLoginStateRef.current) {
      return;
    }

    hasCheckedLoginStateRef.current = true;

    if (loginState?.isLoggedIn) {
      setLoginStatus(true);
      setShowAccountInfo(false);
    }
  }, [settingsReady, account]);

  const handleConnect = async () => {
    if (!password.trim()) {
      setPasswordError(true);
      return;
    }

    setPasswordError(false);
    setShowAccountInfo(true);
    setStepStatus({color: "red", info: t("trading.status_not_logged_in")});
    if (!account) {
      alert(t("trading.account_not_set"));
      return;
    }

    setStepStatus({color: "orange", info: t("trading.status_webctp_trade")});
    engineClient?.webCtpTradeConnect({
      url: settings.tradingEndpoint,
      broker_id: account.broker_id,
      investor_id: account.user_id
    });
  };

  const handleOpenAccountConfig = () => {
    setAccountFormSignal((prev) => (prev ?? 0) + 1);
  };

  const handleLogout = () => {
    engineClient?.webCtpMarketDataDisconnect();
    engineClient?.webCtpTradeLogout(account?.user_id || "");
    setStepStatus({color: "red", info: t("trading.status_not_logged_in")});
    if (accountInfoIntervalRef.current) {
      clearInterval(accountInfoIntervalRef.current);
    }
  };

  const fmtMoney = (v?: any) => {
    if (v === undefined || v === null || v === "") return "--";
    const n = Number(v);
    return isNaN(n) ? String(v) : n.toFixed(2);
  };

  const fmtText = (v: string) => {
    return (v === undefined || v === null || v === "") ? "--" : v;
  };

  const accountPage = showAccountInfo ? <div 
    style={{
      position: "relative",
      width: "100%",
      height: "fit-content",
      border: "2px solid var(--theme-border-color)",
      borderRadius: "8px",
      backgroundColor: "#00000025",
      display: "flex",
      flexDirection: "column",
      padding: "14px",
      boxSizing: "border-box",
      gap: "10px",
      justifyContent: "center"
  }}>
    {account ? (
      <div>
        <InlineT3>{t("trading.account")}: {account.alias || account.user_id}</InlineT3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "15px", marginTop: "8px" }}>
          <span>{t("trading.user_id")}: {account.user_id}</span>
          <span>{t("trading.broker_id")}: {account.broker_id}</span>
          <span>{t("trading.front_trade_addr")}: {tradeEndpoint}</span>
          <span>{t("trading.front_market_data_addr")}: {marketEndpoint}</span>
        </div>
      </div>
    ) : (
      <div style={{ textAlign: "center", width: "100%", color: "var(--theme-font-color)" }}>
        {t("trading.account_not_set")}
      </div>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <InlineT3>{t("trading.password")}</InlineT3>
        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConnect();
            }
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            border: passwordError ? "2px solid #ff4d4f" : "1px solid var(--theme-border-color)",
            backgroundColor: darkMode ? "#2a2e35" : "#bdc2cd",
            color: "var(--theme-font-color-content)",
            boxSizing: "border-box",
            outline: "none",
            boxShadow: passwordError ? "0 0 0 3px rgba(255,77,79,0.25)" : undefined
          }}
          placeholder={t("trading.password_placeholder") ?? ""}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", marginTop: "4px" }}>
        <span style={{ color: stepStatus.color, fontWeight: 600 }}>
          {stepStatus.info}
        </span>
      </div>
      <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "auto" }}>
        <button
          type="button"
          onClick={handleConnect}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid var(--theme-border-color)",
            backgroundColor: darkMode ? "#2a2e35" : "#bdc2cd",
            color: "var(--theme-font-color-content)",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          {t("trading.connect_and_login")}
        </button>
        <button
          type="button"
          onClick={handleOpenAccountConfig}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid var(--theme-border-color)",
            backgroundColor: darkMode ? "#2a2e35" : "#bdc2cd",
            color: "var(--theme-font-color-content)",
            cursor: "pointer",
            fontWeight: 700
          }}
        >
          {t("common.edit")}
        </button>
      </div>
    </div> : loginStatus ? (
      <div style={{
        position: "relative",
        width: "100%",
        height: "fit-content",
        border: "2px solid var(--theme-border-color)",
        borderRadius: "8px",
        backgroundColor: "#00000025",
        display: "flex",
        flexDirection: "column",
        padding: "14px",
        boxSizing: "border-box",
        gap: "10px",
      }}>
        <InlineT3>{t("trading.account_info")}</InlineT3>
        {!tradingAccountInfo ? (
          <div style={{ textAlign: "center", color: "var(--theme-font-color)" }}>{t("trading.no_account_info")}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <InfoLine label={t("trading.account_id") || 'Account'} value={fmtText(tradingAccountInfo.AccountId)} />
            <InfoLine label={t("trading.broker_id") || 'Broker'} value={fmtText(tradingAccountInfo.BrokerId)} />
            <InfoLine label={t("trading.currency") || 'Currency'} value={fmtText(tradingAccountInfo.CurrencyId)} />
            <InfoLine label={t("trading.available") || 'Available'} value={fmtMoney(tradingAccountInfo.Available)} />
            <InfoLine label={t("trading.withdraw_quota") || 'WithdrawQuota'} value={fmtMoney(tradingAccountInfo.WithdrawQuota)} />
            <InfoLine label={t("trading.pre_balance") || 'PreBalance'} value={fmtMoney(tradingAccountInfo.PreBalance)} />
            <InfoLine label={t("trading.deposit") || 'Deposit'} value={fmtMoney(tradingAccountInfo.Deposit)} />
            <InfoLine label={t("trading.withdraw") || 'Withdraw'} value={fmtMoney(tradingAccountInfo.Withdraw)} />
            <InfoLine label={t("trading.cash_in") || 'CashIn'} value={fmtMoney(tradingAccountInfo.CashIn)} />
            <InfoLine label={t("trading.commission") || 'Commission'} value={fmtMoney(tradingAccountInfo.Commission)} />
            <InfoLine label={t("trading.close_profit") || 'CloseProfit'} value={fmtMoney(tradingAccountInfo.CloseProfit)} />
            <InfoLine label={t("trading.position_profit") || 'PositionProfit'} value={fmtMoney(tradingAccountInfo.PositionProfit)} />
            <InfoLine label={t("trading.curr_margin") || 'CurrentMargin'} value={fmtMoney(tradingAccountInfo.CurrentMargin)} />
            <InfoLine label={t("trading.frozen_margin") || 'FrozenMargin'} value={fmtMoney(tradingAccountInfo.FrozenMargin)} />
            <InfoLine label={t("trading.exchange_margin") || 'ExchangeMargin'} value={fmtMoney(tradingAccountInfo.ExchangeMargin)} />
            <InfoLine label={t("trading.credit") || 'Credit'} value={fmtMoney(tradingAccountInfo.Credit)} />
            <InfoLine label={t("trading.mortgage") || 'Mortgage'} value={fmtMoney(tradingAccountInfo.Mortgage)} />
            <InfoLine label={t("trading.reserve_balance") || 'ReserveBalance'} value={fmtMoney(tradingAccountInfo.ReserveBalance)} />
            <InfoLine label={t("trading.trading_day") || 'TradingDay'} value={fmtText(tradingAccountInfo.TradingDay)} />
            <InfoLine label={t("trading.settlement_id") || 'SettlementId'} value={fmtText(tradingAccountInfo.SettlementId)} />
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                height: "fit-content",
                padding: "10px 12px",
                marginTop: "12px",
                borderRadius: "10px",
                border: "1px solid var(--theme-border-color)",
                backgroundColor: "#e92020",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ff7875";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ff4d4f";
              }}
            >
              {t("trading.logout") || "Logout"}
            </button>

          </div>
        )}
      </div>
    ) : <></>;


  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex"
      }}
    >
      <div
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          height: "100%",
          backgroundColor: "var(--theme-sidebar-bg-color)",
          padding: "16px",
          boxSizing: "border-box",
          color: "var(--theme-font-color-content)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start"
        }}
      >
        {engineClient?.ready() ? (
          accountPage
        ) : showAccountInfo === true ? t("trading.engine_not_connected") : (
          <></>
        )}
      </div>
      <div
        style={{
          flex: 1,
          height: "100%",
          background: "transparent",
          padding: "16px",
          boxSizing: "border-box",
          color: "var(--theme-font-color-content)"
        }}
      >
      </div>

      <TradingAccount
        settings={settings}
        settingsReady={settingsReady}
        darkMode={darkMode}
        onChange={onChange}
        openFormSignal={accountFormSignal}
      />
    </div>
  );
}
