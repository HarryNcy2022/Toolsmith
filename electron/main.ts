import { app, BrowserWindow, shell, globalShortcut, ipcMain } from 'electron';
import { join } from 'path';
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  validateAccelerator
} from './config';

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'DevUtils',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

function toggleWindow(): void {
  if (!mainWindow) {
    mainWindow = createWindow();
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

let currentAccelerator = DEFAULT_CONFIG.hotkey;

function registerHotkey(accelerator: string): void {
  const ret = globalShortcut.register(accelerator, () => {
    toggleWindow();
  });
  if (!ret) {
    console.warn('[dev-utils] Failed to register global hotkey (' + accelerator + ')');
  }
}

function safeReRegisterHotkey(accelerator: string): { success: boolean; error?: string } {
  const v = validateAccelerator(accelerator);
  if (!v.valid) {
    return { success: false, error: v.error };
  }
  globalShortcut.unregister(currentAccelerator);
  const ret = globalShortcut.register(accelerator, () => {
    toggleWindow();
  });
  if (ret) {
    currentAccelerator = accelerator;
    try {
      const cfg = loadConfig();
      saveConfig({ ...cfg, hotkey: accelerator });
    } catch (e) {
      console.warn('[dev-utils] failed to persist hotkey', e);
    }
    return { success: true };
  }
  // rollback: re-register the previous accelerator
  globalShortcut.register(currentAccelerator, () => {
    toggleWindow();
  });
  return { success: false, error: 'Failed to register accelerator: ' + accelerator };
}

// IPC handlers
ipcMain.handle('app:toggle-window', () => {
  toggleWindow();
});

ipcMain.handle('config:get', (_e, key?: string) => {
  const cfg = loadConfig();
  return key ? (cfg as unknown as Record<string, unknown>)[key] : cfg;
});

ipcMain.handle('config:set', (_e, key: string, value: unknown) => {
  if (key !== 'hotkey') {
    return { success: false, error: 'Unknown config key: ' + key };
  }
  const v = validateAccelerator(String(value));
  if (!v.valid) {
    return { success: false, error: v.error };
  }
  return safeReRegisterHotkey(String(value));
});

ipcMain.handle('app:read-clipboard', async () => {
  const { clipboard } = await import('electron');
  return clipboard.readText();
});

ipcMain.handle('app:clipboard-has-image', async () => {
  const { clipboard } = await import('electron');
  return clipboard.has('image/png') || clipboard.has('image/jpeg');
});

void app.whenReady().then(() => {
  mainWindow = createWindow();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  const cfg = loadConfig();
  currentAccelerator = cfg.hotkey;
  registerHotkey(currentAccelerator);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on win/lnx — user may toggle back via hotkey
  // Only quit on explicit Cmd+Q or menu quit
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
