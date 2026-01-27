"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isValidIpv4, isValidPort } from "../../utils/validation";
import type { AppSettings, TradingAccount } from "../../../types/settings";

type TradingAccountProps = {
  settings: AppSettings;
  settingsReady: boolean;
  darkMode: boolean;
  onChange: (patch: Partial<AppSettings>) => void;
};

type FieldKey = keyof TradingAccount;

type FormState = Record<FieldKey, string>;

type FieldErrors = Partial<Record<FieldKey, string>>;

const EMPTY_FORM: FormState = {
  user_id: "",
  broker_id: "",
  front_trade_addr: "",
  front_trade_port: "",
  front_market_data_addr: "",
  front_market_data_port: ""
};

const hasCompleteAccount = (account: TradingAccount | null | undefined): account is TradingAccount => {
  if (!account) {
    return false;
  }
  return Boolean(
    account.user_id &&
    account.broker_id &&
    isValidIpv4(account.front_trade_addr) &&
    isValidIpv4(account.front_market_data_addr) &&
    isValidPort(String(account.front_trade_port)) &&
    isValidPort(String(account.front_market_data_port))
  );
};

const deriveFormState = (account: TradingAccount | null | undefined): FormState => ({
  user_id: account?.user_id ?? "",
  broker_id: account?.broker_id ?? "",
  front_trade_addr: account?.front_trade_addr ?? "",
  front_trade_port: account ? String(account.front_trade_port) : "",
  front_market_data_addr: account?.front_market_data_addr ?? "",
  front_market_data_port: account ? String(account.front_market_data_port) : ""
});

export default function TradingAccount({ settings, settingsReady, darkMode, onChange }: TradingAccountProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }
    setForm(deriveFormState(settings.tradingAccount));
    setErrors({});
    setShowOverlay(!hasCompleteAccount(settings.tradingAccount));
  }, [settings, settingsReady]);

  const fields = useMemo(
    () => [
      { key: "user_id" as FieldKey, label: t("tradingPage.user_id") },
      { key: "broker_id" as FieldKey, label: t("tradingPage.broker_id") },
      { key: "front_trade_addr" as FieldKey, label: t("tradingPage.front_trade_addr") },
      { key: "front_trade_port" as FieldKey, label: t("tradingPage.front_trade_port"), inputMode: "numeric" as const },
      { key: "front_market_data_addr" as FieldKey, label: t("tradingPage.front_market_data_addr") },
      { key: "front_market_data_port" as FieldKey, label: t("tradingPage.front_market_data_port"), inputMode: "numeric" as const }
    ],
    [t]
  );

  const handleInputChange = (key: FieldKey, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const validateAndSave = () => {
    const nextErrors: FieldErrors = {};

    const trimmed: FormState = {
      user_id: form.user_id.trim(),
      broker_id: form.broker_id.trim(),
      front_trade_addr: form.front_trade_addr.trim(),
      front_trade_port: form.front_trade_port.trim(),
      front_market_data_addr: form.front_market_data_addr.trim(),
      front_market_data_port: form.front_market_data_port.trim()
    };

    const requireField = (key: FieldKey) => {
      if (!trimmed[key]) {
        nextErrors[key] = "required";
      }
    };

    requireField("user_id");
    requireField("broker_id");
    requireField("front_trade_addr");
    requireField("front_trade_port");
    requireField("front_market_data_addr");
    requireField("front_market_data_port");

    if (trimmed.front_trade_addr && !isValidIpv4(trimmed.front_trade_addr)) {
      nextErrors.front_trade_addr = "invalid";
    }

    if (trimmed.front_market_data_addr && !isValidIpv4(trimmed.front_market_data_addr)) {
      nextErrors.front_market_data_addr = "invalid";
    }

    if (trimmed.front_trade_port && !isValidPort(trimmed.front_trade_port)) {
      nextErrors.front_trade_port = "invalid";
    }

    if (trimmed.front_market_data_port && !isValidPort(trimmed.front_market_data_port)) {
      nextErrors.front_market_data_port = "invalid";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setShowOverlay(true);
      return;
    }

    const account: TradingAccount = {
      user_id: trimmed.user_id,
      broker_id: trimmed.broker_id,
      front_trade_addr: trimmed.front_trade_addr,
      front_trade_port: Number.parseInt(trimmed.front_trade_port, 10),
      front_market_data_addr: trimmed.front_market_data_addr,
      front_market_data_port: Number.parseInt(trimmed.front_market_data_port, 10)
    };

    onChange({ tradingAccount: account });
    setShowOverlay(false);
  };

  const showErrorHint = Object.keys(errors).length > 0;

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: hasError ? "2px solid #f87171" : "1px solid var(--theme-border-color)",
    backgroundColor: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    color: "var(--theme-font-color-content)",
    outline: hasError ? "2px solid rgba(248, 113, 113, 0.35)" : "none",
    transition: "border 120ms ease, outline 120ms ease"
  } as const);

  if (!showOverlay) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "brightness(0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1500,
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "540px",
          maxWidth: "92vw",
          backgroundColor: "var(--theme-background-color)",
          borderRadius: "16px",
          border: "1px solid var(--theme-border-color)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          padding: "22px",
          color: "var(--theme-font-color-content)",
          filter: "brightness(1.02)"
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
          {t("tradingPage.setup_title")}
        </div>
        <div style={{ color: "var(--theme-font-color)", marginBottom: "14px", lineHeight: 1.4 }}>
          {t("tradingPage.setup_desc")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.map((field) => (
            <label key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: 600 }}>{field.label}</span>
              <input
                type="text"
                inputMode={field.inputMode}
                value={form[field.key]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                style={inputStyle(Boolean(errors[field.key]))}
                aria-invalid={Boolean(errors[field.key])}
              />
            </label>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "16px"
          }}
        >
          <div style={{ color: showErrorHint ? "#f87171" : "var(--theme-font-color)", fontSize: "13px" }}>
            {showErrorHint ? t("tradingPage.validation_error") : t("tradingPage.validation_hint")}
          </div>
          <button
            type="button"
            onClick={validateAndSave}
            style={{
              minWidth: "110px",
              padding: "10px 16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: darkMode ? "#4b5563" : "#e5e7eb",
              color: darkMode ? "#f9fafb" : "#1f2937",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
              transition: "transform 120ms ease, filter 120ms ease"
            }}
          >
            {t("tradingPage.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
