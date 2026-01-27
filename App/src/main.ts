import { app, BrowserWindow, ipcMain } from 'electron';
import type { Input } from 'electron';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { WindowControlAction, WindowFrameState } from './types/window-controls';
import type { AppSettings, DataSourceKey, DataSourceEntry, LanguageSetting, ThemeSetting, TradingAccount } from './types/settings';

const isDevelopment = process.env.NODE_ENV === 'development';

const stripAnsi = (value: string) =>
  value.replace(/[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const sanitizeUrl = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  const cleaned = stripAnsi(value).trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const appUrlFromEnv = sanitizeUrl(process.env.NEXT_APP_URL);
const staticIndexPath = path.join(__dirname, '..', 'out', 'index.html');
const iconFilenames = ['QuantDirect.ico', 'QuantDirect.png'];

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

const DEFAULT_MARKET_ENDPOINT = 'ws://localhost:8888/market_data';
const DEFAULT_TRADING_ENDPOINT = 'ws://localhost:8888/trading';
const DATA_SOURCE_DEFAULTS: Record<DataSourceKey, DataSourceEntry> = {
  futuresCalendar: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futuresContracts: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futuresTick: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futures1m: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  brokerPositions: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  optionsContracts: { localPath: '', apiUrl: 'https://data.tabxx.net/api/options' },
  optionsTick: { localPath: '', apiUrl: 'https://data.tabxx.net/api/options' }
};

const getSettingsFilePath = () => path.join(app.getPath('userData'), SETTINGS_FILENAME);

const normalizeTheme = (value: unknown): ThemeSetting => {
  if (value === 'dark') {
    return 'dark';
  }
  if (value === 'light') {
    return 'light';
  }
  return 'system';
};

const normalizeLanguage = (value: unknown): LanguageSetting => {
  if (value === 'system') {
    return 'system';
  }

  if (typeof value !== 'string') {
    return 'system';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('en')) {
    return 'en-US';
  }
  if (normalized === 'zh-cn' || normalized === 'zh-hans' || normalized === 'zh-sg' || normalized === 'zh') {
    return 'zh-CN';
  }
  if (normalized === 'zh-hk' || normalized === 'zh-tw' || normalized === 'zh-hant' || normalized === 'zh-mo') {
    return 'zh-HK';
  }

  return 'system';
};

const isValidIpv4 = (value: string): boolean => {
  const trimmed = value.trim();
  const octet = '(25[0-5]|2[0-4]\\d|1?\\d?\\d)';
  const regex = new RegExp(`^${octet}\\.${octet}\\.${octet}\\.${octet}$`);
  return regex.test(trimmed);
};

const normalizePort = (value: unknown): number | null => {
  const port = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isInteger(port)) {
    return null;
  }
  return port >= 1 && port <= 65535 ? port : null;
};

const normalizeTradingAccount = (value: unknown): TradingAccount | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybe = value as Partial<TradingAccount>;
  const userId = typeof maybe.user_id === 'string' ? maybe.user_id.trim() : '';
  const brokerId = typeof maybe.broker_id === 'string' ? maybe.broker_id.trim() : '';
  const tradeAddr = typeof maybe.front_trade_addr === 'string' ? maybe.front_trade_addr.trim() : '';
  const marketAddr = typeof maybe.front_market_data_addr === 'string' ? maybe.front_market_data_addr.trim() : '';
  const tradePort = normalizePort(maybe.front_trade_port);
  const marketPort = normalizePort(maybe.front_market_data_port);

  if (!userId || !brokerId || !tradeAddr || !marketAddr || tradePort === null || marketPort === null) {
    return null;
  }

  if (!isValidIpv4(tradeAddr) || !isValidIpv4(marketAddr)) {
    return null;
  }

  return {
    user_id: userId,
    broker_id: brokerId,
    front_trade_addr: tradeAddr,
    front_trade_port: tradePort,
    front_market_data_addr: marketAddr,
    front_market_data_port: marketPort
  };
};

const normalizeSettings = (settings?: Partial<AppSettings> | null): AppSettings => ({
  theme: normalizeTheme(settings?.theme),
  language: normalizeLanguage(settings?.language),
  marketDataEndpoint: typeof settings?.marketDataEndpoint === 'string' && settings.marketDataEndpoint.trim().length > 0
    ? settings.marketDataEndpoint.trim()
    : DEFAULT_MARKET_ENDPOINT,
  tradingEndpoint: typeof settings?.tradingEndpoint === 'string' && settings.tradingEndpoint.trim().length > 0
    ? settings.tradingEndpoint.trim()
    : DEFAULT_TRADING_ENDPOINT,
  dataSources: (Object.keys(DATA_SOURCE_DEFAULTS) as DataSourceKey[]).reduce<Record<DataSourceKey, DataSourceEntry>>((acc, key) => {
    const entry = settings?.dataSources?.[key];
    const localPath = typeof entry?.localPath === 'string' ? entry.localPath.trim() : '';
    const apiUrl = typeof entry?.apiUrl === 'string' ? entry.apiUrl.trim() : '';
    const hasLocal = Boolean(localPath);
    const hasApi = Boolean(apiUrl);

    if (hasLocal || hasApi) {
      acc[key] = {
        localPath,
        apiUrl: apiUrl // allow empty when local provided
      };
    } else {
      acc[key] = { ...DATA_SOURCE_DEFAULTS[key] };
    }
    return acc;
  }, {} as Record<DataSourceKey, DataSourceEntry>),
  tradingAccount: normalizeTradingAccount(settings?.tradingAccount)
});

const defaultSettings = (): AppSettings => ({
  theme: 'system',
  language: 'system',
  marketDataEndpoint: DEFAULT_MARKET_ENDPOINT,
  tradingEndpoint: DEFAULT_TRADING_ENDPOINT,
  dataSources: { ...DATA_SOURCE_DEFAULTS },
  tradingAccount: null
});

const readSettingsFromDisk = async (): Promise<AppSettings | null> => {
  const settingsPath = getSettingsFilePath();
  try {
    const raw = await fsPromises.readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
};

const writeSettingsToDisk = async (settings: AppSettings) => {
  const settingsPath = getSettingsFilePath();
  await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
  await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
};

const ensureSettings = async (): Promise<AppSettings> => {
  const existing = await readSettingsFromDisk();
  if (existing) {
    return existing;
  }

  const defaults = defaultSettings();
  await writeSettingsToDisk(defaults);
  return defaults;
};

const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const normalized = normalizeSettings(settings);
  await writeSettingsToDisk(normalized);
  return normalized;
};

const WINDOW_CONTROL_CHANNEL = 'window-control';
const WINDOW_STATE_CHANNEL = 'window-state-change';
const WINDOW_SCALE_CHANNEL = 'window-scale-change';
const SETTINGS_LOAD_CHANNEL = 'app-settings-load';
const SETTINGS_SAVE_CHANNEL = 'app-settings-save';
const SETTINGS_PATH_CHANNEL = 'app-settings-path';
const SETTINGS_FILENAME = 'settings.json';

let mainWindow: BrowserWindow | null = null;
const gotTheLock = app.requestSingleInstanceLock();

const resolveIconPath = (): string | undefined => {
  for (const filename of iconFilenames) {
    const devIconPath = path.join(__dirname, '..', 'resource', filename);
    if (fs.existsSync(devIconPath)) {
      return devIconPath;
    }

    const packagedResourceIconPath = path.join(process.resourcesPath, 'resource', filename);
    if (fs.existsSync(packagedResourceIconPath)) {
      return packagedResourceIconPath;
    }

    const packagedRootIconPath = path.join(process.resourcesPath, filename);
    if (fs.existsSync(packagedRootIconPath)) {
      return packagedRootIconPath;
    }
  }

  return undefined;
};

const loadTarget = (): string => {
  if (appUrlFromEnv && appUrlFromEnv.startsWith('http')) {
    return appUrlFromEnv;
  }

  if (fs.existsSync(staticIndexPath)) {
    return pathToFileURL(staticIndexPath).href;
  }

  if (appUrlFromEnv) {
    return appUrlFromEnv;
  }

  return 'about:blank';
};

const getWindowFrameState = (window: BrowserWindow): WindowFrameState => {
  if (window.isDestroyed()) {
    return 'restored';
  }

  if (window.isFullScreen()) {
    return 'fullscreen';
  }

  if (window.isMaximized()) {
    return 'maximized';
  }

  return 'restored';
};

const sendWindowState = (window: BrowserWindow) => {
  if (window.isDestroyed()) {
    return;
  }

  const { webContents } = window;
  if (!webContents.isDestroyed()) {
    webContents.send(WINDOW_STATE_CHANNEL, getWindowFrameState(window));
  }
};

const sendWindowScale = (window: BrowserWindow) => {
  if (window.isDestroyed()) {
    return;
  }

  const { webContents } = window;
  if (!webContents.isDestroyed()) {
    webContents.send(WINDOW_SCALE_CHANNEL, webContents.getZoomFactor());
  }
}

const setupWindowZoomControls = (window: BrowserWindow) => {
  const { webContents } = window;
  let zoomFactor = 1;

  const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  const applyZoom = (value: number) => {
    const next = clampZoom(Number(value.toFixed(2)));
    if (!webContents.isDestroyed()) {
      webContents.setZoomFactor(next);
      sendWindowScale(window);
    }
    zoomFactor = next;
  };

  const handleInput = (event: Electron.Event, input: Input) => {
    if (!(input.control || input.meta)) {
      return;
    }

    switch (input.key) {
      case '+':
      case '=':
      case 'Add':
        applyZoom(zoomFactor + ZOOM_STEP);
        event.preventDefault();
        break;
      case '-':
      case '_':
      case 'Subtract':
        applyZoom(zoomFactor - ZOOM_STEP);
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  webContents.on('before-input-event', handleInput);
  window.on('closed', () => {
    if (!webContents.isDestroyed()) {
      webContents.removeListener('before-input-event', handleInput);
    }
  });
};

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    icon: resolveIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const emitWindowState = () => {
    sendWindowState(window);
  };

  window.on('maximize', emitWindowState);
  window.on('unmaximize', emitWindowState);
  window.on('enter-full-screen', emitWindowState);
  window.on('leave-full-screen', emitWindowState);
  window.on('minimize', emitWindowState);
  window.on('restore', emitWindowState);

  window.once('ready-to-show', () => {
    window.show();
    emitWindowState();
  });

  setupWindowZoomControls(window);

  const target = loadTarget();
  if (isDevelopment) {
    console.info('[electron] loading URL:', target);
  }
  window.loadURL(target).catch((error) => {
    console.error('Failed to load main window:', error);
  });

  if (isDevelopment && target.startsWith('http')) {
    try {
      window.webContents.openDevTools({ mode: 'detach' });
    } catch (error) {
      void error;
    }
  }

  return window;
};

ipcMain.handle(WINDOW_CONTROL_CHANNEL, (event, action: WindowControlAction) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);

  if (!targetWindow) {
    return undefined;
  }

  switch (action) {
    case 'minimize':
      targetWindow.minimize();
      sendWindowState(targetWindow);
      return undefined;
    case 'toggle-maximize':
      if (targetWindow.isFullScreen()) {
        targetWindow.setFullScreen(false);
      } else if (targetWindow.isMaximized()) {
        targetWindow.unmaximize();
      } else {
        targetWindow.maximize();
      }
      sendWindowState(targetWindow);
      return getWindowFrameState(targetWindow);
    case 'close':
      targetWindow.close();
      return undefined;
    case 'get-state':
      return getWindowFrameState(targetWindow);
    default:
      return undefined;
  }
});

ipcMain.handle(SETTINGS_LOAD_CHANNEL, async () => ensureSettings());

ipcMain.handle(SETTINGS_SAVE_CHANNEL, async (_event, settings: AppSettings) => saveSettings(settings));

ipcMain.handle(SETTINGS_PATH_CHANNEL, async () => {
  await ensureSettings();
  return getSettingsFilePath();
});

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('QuantDirect');
    mainWindow = createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
