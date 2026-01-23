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
  marketDataEndpoint: string;
  tradingEndpoint: string;
  dataSources: Record<DataSourceKey, DataSourceEntry>;
}

export interface SettingsAPI {
  load: () => Promise<AppSettings>;
  save: (settings: AppSettings) => Promise<AppSettings>;
  getPath?: () => Promise<string>;
}
