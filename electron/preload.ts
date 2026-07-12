import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('devutils', {
  toggleWindow: () => ipcRenderer.invoke('app:toggle-window'),
  readClipboard: () => ipcRenderer.invoke('app:read-clipboard'),
  clipboardHasImage: () => ipcRenderer.invoke('app:clipboard-has-image'),
  getConfig: (key?: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value)
});
