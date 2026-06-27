import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('devutils', {
  toggleWindow: () => ipcRenderer.invoke('app:toggle-window'),
  readClipboard: () => ipcRenderer.invoke('app:read-clipboard')
});
