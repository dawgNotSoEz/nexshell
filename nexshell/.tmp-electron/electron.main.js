"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron = __importStar(require("electron"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
require("./src/main/backend");
const { app, BrowserWindow, Menu, ipcMain } = electron;
const isDev = process.env.NODE_ENV === 'development';
const devServerURL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173/';
const projectRoot = node_path_1.default.resolve(__dirname, isDev ? '.' : '..');
function resolvePreloadPath() {
    const compiledPreload = node_path_1.default.join(projectRoot, '.tmp-electron', 'preload.js');
    if (!isDev && node_fs_1.default.existsSync(compiledPreload)) {
        return compiledPreload;
    }
    return node_path_1.default.join(projectRoot, 'preload.ts');
}
function resolveRendererEntry() {
    if (isDev) {
        return devServerURL;
    }
    return node_path_1.default.join(projectRoot, 'dist', 'index.html');
}
function createMainWindow() {
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
        win.loadURL(devUrl).catch((error) => {
            console.error('Failed to load dev server URL', error);
        });
        win.webContents.openDevTools({ mode: 'detach' });
        return;
    }
    const rendererPath = resolveRendererEntry();
    win.loadFile(rendererPath).catch((error) => {
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
ipcMain.handle('nexshell:window-control', (event, action) => {
    // Validate action type
    if (typeof action !== 'string') {
        return { isMaximized: false };
    }
    const validActions = ['minimize', 'toggle-maximize', 'close', 'get-state'];
    if (!validActions.includes(action)) {
        console.warn('Invalid window control action:', action);
        return { isMaximized: false };
    }
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target) {
        return { isMaximized: false };
    }
    switch (action) {
        case 'minimize':
            target.minimize();
            break;
        case 'toggle-maximize':
            if (target.isMaximized()) {
                target.unmaximize();
            }
            else {
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
