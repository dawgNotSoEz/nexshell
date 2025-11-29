"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    getHostInfo: () => electron_1.ipcRenderer.invoke('nexshell:getHostInfo'),
    executeCommand: (input) => electron_1.ipcRenderer.invoke('nexshell:executeCommand', { input }),
    windowControls: {
        minimize: async () => electron_1.ipcRenderer.invoke('nexshell:window-control', 'minimize'),
        toggleMaximize: async () => electron_1.ipcRenderer.invoke('nexshell:window-control', 'toggle-maximize'),
        close: async () => electron_1.ipcRenderer.invoke('nexshell:window-control', 'close'),
        getState: async () => electron_1.ipcRenderer.invoke('nexshell:window-control', 'get-state'),
        onStateChange: (listener) => {
            const handler = (_event, payload) => listener(payload);
            electron_1.ipcRenderer.on('nexshell:window-state', handler);
            return () => electron_1.ipcRenderer.removeListener('nexshell:window-state', handler);
        }
    }
};
electron_1.contextBridge.exposeInMainWorld('nexshellAPI', api);
