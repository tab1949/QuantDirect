import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { WindowControlAction, WindowFrameState } from './types/window-controls';

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

const WINDOW_CONTROL_CHANNEL = 'window-control';
const WINDOW_STATE_CHANNEL = 'window-state-change';

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

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
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
