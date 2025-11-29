import * as electron from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import './src/main/backend';

const { app, BrowserWindow, Menu, ipcMain } = electron;
const isDev = process.env.NODE_ENV === 'development';
const devServerURL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173/';
const projectRoot = path.resolve(__dirname, isDev ? '.' : '..');

function resolvePreloadPath(): string {
  const compiledPreload = path.join(projectRoot, '.tmp-electron', 'preload.js');

  if (!isDev && fs.existsSync(compiledPreload)) {
    return compiledPreload;
  }

  return path.join(projectRoot, 'preload.ts');
}

function resolveRendererEntry(): string {
  if (isDev) {
    return devServerURL;
  }

  return path.join(projectRoot, 'dist', 'index.html');
}

function createMainWindow(): void {
  const preloadScript = resolvePreloadPath();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#040404',
    show: false,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: preloadScript,
      nodeIntegration: false, // Security: Disable Node.js in renderer
      contextIsolation: true, // Security: Isolate context between main and renderer
      sandbox: false, // Note: sandbox requires additional preload setup
      webSecurity: true, // Security: Enable web security
      allowRunningInsecureContent: false, // Security: Disallow insecure content
      experimentalFeatures: false // Security: Disable experimental features
    }
  });

  // Security: Prevent navigation to external URLs
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== win.webContents.getURL()) {
      event.preventDefault();
      console.warn('Blocked navigation to external URL:', navigationUrl);
    }
  });

  // Security: Prevent new window creation
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => {
    win.show();
    emitWindowState();
  });

  const emitWindowState = () => {
    win.webContents.send('nexshell:window-state', { isMaximized: win.isMaximized() });
  };

  win.on('maximize', emitWindowState);
  win.on('unmaximize', emitWindowState);

  if (isDev) {
    const devUrl = resolveRendererEntry();
    win.loadURL(devUrl).catch((error: unknown) => {
      console.error('Failed to load dev server URL', error);
    });
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const rendererPath = resolveRendererEntry();
  win.loadFile(rendererPath).catch((error: unknown) => {
    console.error('Failed to load renderer bundle', error);
  });
}

app.whenReady().then(() => {
  app.setName('NexShell');
  Menu.setApplicationMenu(null);
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

type WindowControlAction = 'minimize' | 'toggle-maximize' | 'close' | 'get-state';

ipcMain.handle('nexshell:window-control', (event, action: unknown) => {
  // Validate action type
  if (typeof action !== 'string') {
    return { isMaximized: false };
  }

  const validActions: WindowControlAction[] = ['minimize', 'toggle-maximize', 'close', 'get-state'];
  if (!validActions.includes(action as WindowControlAction)) {
    console.warn('Invalid window control action:', action);
    return { isMaximized: false };
  }

  const target = BrowserWindow.fromWebContents(event.sender);
  if (!target) {
    return { isMaximized: false };
  }

  switch (action as WindowControlAction) {
    case 'minimize':
      target.minimize();
      break;
    case 'toggle-maximize':
      if (target.isMaximized()) {
        target.unmaximize();
      } else {
        target.maximize();
      }
      break;
    case 'close':
      target.close();
      break;
    case 'get-state':
    default:
      break;
  }

  return { isMaximized: target.isMaximized() };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
