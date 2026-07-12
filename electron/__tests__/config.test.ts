// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFileSync, readFileSync, rmSync } from 'fs';
import {
  AppConfig,
  DEFAULT_CONFIG,
  parseConfig,
  serializeConfig,
  validateAccelerator,
  mergeConfig,
  loadConfigFrom,
  saveConfigTo
} from '../config';

// Keep the `electron` import (used by configPath/configPath glue) resolvable in
// a plain Node test environment by stubbing it out.
vi.mock('electron', () => ({
  app: {
    getPath: () => join(tmpdir(), 'devutils-test-userdata')
  }
}));

describe('parseConfig', () => {
  it('parseConfig-valid: parses a stored object merging over defaults', () => {
    expect(parseConfig('{"hotkey":"CmdOrCtrl+Shift+E"}')).toEqual({
      hotkey: 'CmdOrCtrl+Shift+E'
    });
  });

  it('parseConfig-bad-json: returns DEFAULT_CONFIG on parse error', () => {
    expect(parseConfig('{not json')).toEqual(DEFAULT_CONFIG);
  });

  it('parseConfig-null: returns DEFAULT_CONFIG when raw is null', () => {
    expect(parseConfig(null)).toEqual(DEFAULT_CONFIG);
  });

  it('parseConfig-partial: returns the parsed object (merge handled separately)', () => {
    expect(parseConfig('{"hotkey":"X"}')).toEqual({ hotkey: 'X' });
  });
});

describe('serialize/roundtrip', () => {
  it('serialize-roundtrip: serialize then parse returns the same config', () => {
    expect(parseConfig(serializeConfig({ hotkey: 'A' }))).toEqual({ hotkey: 'A' });
  });
});

describe('validateAccelerator', () => {
  it('validate-good: CommandOrControl+Shift+D is valid', () => {
    expect(validateAccelerator('CommandOrControl+Shift+D')).toEqual({ valid: true });
  });

  it('validate-good-simple: single key and CmdOrCtrl form are valid', () => {
    expect(validateAccelerator('A')).toEqual({ valid: true });
    expect(validateAccelerator('CmdOrCtrl+Shift+E')).toEqual({ valid: true });
  });

  it('validate-empty: empty string is invalid', () => {
    expect(validateAccelerator('')).toEqual({
      valid: false,
      error: expect.stringContaining('empty')
    });
  });

  it('validate-modifiers-only: modifiers without a key are invalid', () => {
    expect(validateAccelerator('CmdOrCtrl+Shift')).toEqual({
      valid: false,
      error: expect.stringContaining('Invalid')
    });
  });

  it('validate-bad: unparseable token is invalid', () => {
    expect(validateAccelerator('NotAKey')).toEqual({ valid: false });
  });
});

describe('mergeConfig', () => {
  it('merge: shallow-merges patch over base', () => {
    expect(mergeConfig(DEFAULT_CONFIG, { hotkey: 'B' })).toEqual({ hotkey: 'B' });
  });
});

describe('loadConfigFrom / saveConfigTo (roundtrip)', () => {
  it('load-save-roundtrip: writes then reads back the same config', () => {
    const path = join(tmpdir(), `devutils-config-${process.pid}-${Date.now()}.json`);
    try {
      const cfg: AppConfig = { hotkey: 'Control+Shift+K' };
      saveConfigTo(path, cfg);
      const loaded = loadConfigFrom(path);
      expect(loaded).toEqual(cfg);
    } finally {
      try {
        rmSync(path);
      } catch {
        /* ignore */
      }
    }
  });

  it('loadConfigFrom-missing: returns DEFAULT_CONFIG when file is absent', () => {
    const path = join(tmpdir(), `devutils-config-missing-${process.pid}-${Date.now()}.json`);
    expect(loadConfigFrom(path)).toEqual(DEFAULT_CONFIG);
  });

  it('loadConfigFrom-bad-json: returns DEFAULT_CONFIG on corrupt file', () => {
    const path = join(tmpdir(), `devutils-config-bad-${process.pid}-${Date.now()}.json`);
    try {
      writeFileSync(path, '{not json', 'utf-8');
      expect(loadConfigFrom(path)).toEqual(DEFAULT_CONFIG);
    } finally {
      try {
        rmSync(path);
      } catch {
        /* ignore */
      }
    }
  });
});

// Reference readFileSync so the import is used even if a future edit drops the
// roundtrip blocks above — keeps the test file self-consistent.
void readFileSync;
