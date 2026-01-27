"use client";

import type { AppSettings } from "../../../types/settings";
import TradingAccount from "./Account";

type TradingPageProps = {
  settings: AppSettings;
  settingsReady: boolean;
  darkMode: boolean;
  onChange: (patch: Partial<AppSettings>) => void;
};

const SIDEBAR_WIDTH = 320;

export default function TradingPage({ settings, settingsReady, darkMode, onChange }: TradingPageProps) {
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
          color: "var(--theme-font-color-content)"
        }}
      >
        左侧交易导航（占位）
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
        右侧交易内容（占位）
      </div>

      <TradingAccount
        settings={settings}
        settingsReady={settingsReady}
        darkMode={darkMode}
        onChange={onChange}
      />
    </div>
  );
}
