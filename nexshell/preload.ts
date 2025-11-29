import { contextBridge, ipcRenderer } from 'electron';
import type { CommandExecutionResult, HostInfo, WindowStatePayload } from './src/types/ipc';

export type { CommandExecutionResult, HostInfo } from './src/types/ipc';

const api = {
  getHostInfo: (): Promise<HostInfo> => ipcRenderer.invoke('nexshell:getHostInfo'),
  executeCommand: (input: string): Promise<CommandExecutionResult> =>
    ipcRenderer.invoke('nexshell:executeCommand', { input }),
  windowControls: {
    minimize: async (): Promise<WindowStatePayload> => ipcRenderer.invoke('nexshell:window-control', 'minimize'),
    toggleMaximize: async (): Promise<WindowStatePayload> =>
      ipcRenderer.invoke('nexshell:window-control', 'toggle-maximize'),
    close: async (): Promise<WindowStatePayload> => ipcRenderer.invoke('nexshell:window-control', 'close'),
    getState: async (): Promise<WindowStatePayload> => ipcRenderer.invoke('nexshell:window-control', 'get-state'),
    onStateChange: (listener: (payload: WindowStatePayload) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: WindowStatePayload) => listener(payload);
      ipcRenderer.on('nexshell:window-state', handler);
      return () => ipcRenderer.removeListener('nexshell:window-state', handler);
    }
  }
};

contextBridge.exposeInMainWorld('nexshellAPI', api);

export type NexShellAPI = typeof api;

declare global {
  interface Window {
    nexshellAPI: NexShellAPI;
  }
}
