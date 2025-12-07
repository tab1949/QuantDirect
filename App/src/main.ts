import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const isDevelopment = process.env.NODE_ENV === 'development';
const appUrlFromEnv = process.env.NEXT_APP_URL;
const staticIndexPath = path.join(__dirname, '..', 'out', 'index.html');

let mainWindow: BrowserWindow | null = null;
const gotTheLock = app.requestSingleInstanceLock();

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

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  const target = loadTarget();
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
