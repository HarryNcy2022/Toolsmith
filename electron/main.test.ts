import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalShortcut } from 'electron';

const handlers: Record<string, (...args: unknown[]) => unknown> = {};

vi.mock('electron', () => {
  class FakeBrowserWindow {
    webContents = { setWindowOpenHandler: vi.fn(), loadURL: vi.fn(), loadFile: vi.fn() };
    on = vi.fn();
    isVisible = vi.fn(() => true);
    isFocused = vi.fn(() => true);
    show = vi.fn();
    hide = vi.fn();
    focus = vi.fn();
    loadURL = vi.fn();
    loadFile = vi.fn();
  }
  return {
    ipcMain: {
      handle: vi.fn((name: string, fn: (...args: unknown[]) => unknown) => {
        handlers[name] = fn;
      })
    },
    globalShortcut: {
      register: vi.fn(() => true),
      unregister: vi.fn(),
      unregisterAll: vi.fn()
    },
    app: {
      whenReady: vi.fn(() => Promise.resolve()),
      getPath: vi.fn(() => '/tmp'),
      on: vi.fn()
    },
    BrowserWindow: FakeBrowserWindow,
    shell: { openExternal: vi.fn() }
  };
});

await import('./main');

const setHandler = handlers['config:set'];

describe('config:set historyHotkey (renderer-only)', () => {
  beforeEach(() => {
    vi.mocked(globalShortcut.register).mockClear();
  });

  it('historyHotkey returns success and does NOT register an OS global shortcut', () => {
    const result = setHandler(null, 'historyHotkey', 'CommandOrControl+Shift+H') as {
      success: boolean;
      error?: string;
    };
    expect(result).toEqual({ success: true });
    expect(vi.mocked(globalShortcut.register).mock.calls.length).toBe(0);
  });

  it('historyHotkey rejects an invalid accelerator', () => {
    const result = setHandler(null, 'historyHotkey', 'Foo+Bar') as {
      success: boolean;
      error?: string;
    };
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(vi.mocked(globalShortcut.register).mock.calls.length).toBe(0);
  });

  it('hotkey still registers a global shortcut (regression)', () => {
    const result = setHandler(null, 'hotkey', 'CommandOrControl+Shift+D') as {
      success: boolean;
      error?: string;
    };
    expect(result).toEqual({ success: true });
    expect(vi.mocked(globalShortcut.register).mock.calls.length).toBeGreaterThan(0);
  });

  it('unknown key returns Unknown config key error', () => {
    const result = setHandler(null, 'unknown', 'x') as {
      success: boolean;
      error?: string;
    };
    expect(result).toEqual({ success: false, error: 'Unknown config key: unknown' });
  });
});
