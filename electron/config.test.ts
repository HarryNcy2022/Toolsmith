import { describe, it, expect, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: () => ''
  }
}));

import { parseConfig, validateAccelerator, DEFAULT_CONFIG } from './config';

describe('config.historyHotkey', () => {
  it('parseConfig("{}") defaults historyHotkey to CommandOrControl+Shift+H', () => {
    const cfg = parseConfig('{}');
    expect(cfg.historyHotkey).toBe('CommandOrControl+Shift+H');
  });

  it('parseConfig keeps custom historyHotkey and hotkey', () => {
    const cfg = parseConfig('{"hotkey":"X","historyHotkey":"Y"}');
    expect(cfg.hotkey).toBe('X');
    expect(cfg.historyHotkey).toBe('Y');
  });

  it('default historyHotkey is a valid accelerator (regression)', () => {
    expect(validateAccelerator('CommandOrControl+Shift+H').valid).toBe(true);
  });

  it('DEFAULT_CONFIG has both hotkey and historyHotkey', () => {
    expect(Object.keys(DEFAULT_CONFIG)).toEqual(
      expect.arrayContaining(['hotkey', 'historyHotkey'])
    );
  });
});
