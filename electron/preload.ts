import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('toolsmith', {
  toggleWindow: () => ipcRenderer.invoke('app:toggle-window'),
  readClipboard: () => ipcRenderer.invoke('app:read-clipboard'),
  clipboardHasImage: () => ipcRenderer.invoke('app:clipboard-has-image'),
  readClipboardImage: () => ipcRenderer.invoke('app:read-clipboard-image'),
  writeClipboardImage: (dataUrl: string) => ipcRenderer.invoke('app:write-clipboard-image', dataUrl),
  getConfig: (key?: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value)
});
