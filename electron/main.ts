import { app, BrowserWindow, shell, globalShortcut, ipcMain } from 'electron';
import { join } from 'path';

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

function registerHotkey(): void {
  // CmdOrCtrl+Shift+D — toggle show/hide
  const ret = globalShortcut.register('CommandOrControl+Shift+D', () => {
    toggleWindow();
  });
  if (!ret) {
    console.warn('[dev-utils] Failed to register global hotkey (CmdOrCtrl+Shift+D)');
  }
}

// IPC handlers
ipcMain.handle('app:toggle-window', () => {
  toggleWindow();
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
  registerHotkey();

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
