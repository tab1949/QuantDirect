export type ThemeSetting = 'system' | 'dark' | 'light';

export type LanguageSetting = 'system' | 'en-US' | 'zh-CN' | 'zh-HK';

export type DataSourceKey =
  | 'futuresCalendar'
  | 'futuresContracts'
  | 'futuresTick'
  | 'futures1m'
  | 'brokerPositions'
  | 'optionsContracts'
  | 'optionsTick';

export interface DataSourceEntry {
  localPath: string;
  apiUrl: string;
}

export interface AppSettings {
  theme: ThemeSetting;
  language: LanguageSetting;
  engineAddress: string;
  enginePort: number;
  startQDEngine: boolean;
  marketDataEndpoint: string;
  tradingEndpoint: string;
  tradingAppId: string | null;
  tradingAuthCode: string | null;
  dataSources: Record<DataSourceKey, DataSourceEntry>;
  tradingAccount: TradingAccount | null;
}

export interface TradingAccount {
  alias: string;
  user_id: string;
  broker_id: string;
  front_trade_addr: string;
  front_trade_port: number;
  front_market_data_addr: string;
  front_market_data_port: number;
}

export interface SettingsAPI {
  load: () => Promise<AppSettings>;
  save: (settings: AppSettings) => Promise<AppSettings>;
  getPath?: () => Promise<string>;
}
