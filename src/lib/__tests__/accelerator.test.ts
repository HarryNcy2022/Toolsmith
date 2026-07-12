import { describe, it, expect } from 'vitest';
import {
  validateAccelerator,
  formatKeysToAccelerator,
  parseAcceleratorToKeys
} from '../accelerator';

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
    expect(validateAccelerator('NotAKey')).toEqual({
      valid: false,
      error: expect.stringContaining('Invalid')
    });
  });
});

describe('formatKeysToAccelerator / parseAcceleratorToKeys', () => {
  it('format-ctrl-d: control + d builds CommandOrControl+D', () => {
    expect(formatKeysToAccelerator({ ctrl: true, meta: true, alt: false, shift: false, key: 'd' })).toBe('CommandOrControl+D');
  });

  it('format-full: meta+shift+e builds CommandOrControl+Shift+E', () => {
    expect(
      formatKeysToAccelerator({ ctrl: true, meta: true, alt: false, shift: true, key: 'e' })
    ).toBe('CommandOrControl+Shift+E');
  });

  it('roundtrip: format then parse returns the same shape', () => {
    const keys = { ctrl: true, shift: true, alt: false, meta: true, key: 'D' };
    const accel = formatKeysToAccelerator(keys);
    // CommandOrControl implies both ctrl and meta (can't be told apart after
    // serialization), so parsing back sets meta:true as well.
    expect(parseAcceleratorToKeys(accel)).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      meta: true,
      key: 'D'
    });
  });
});
