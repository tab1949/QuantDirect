import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

  window.once('ready-to-show', () => {
    window.show();
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
