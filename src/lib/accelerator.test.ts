import { describe, it, expect } from 'vitest';
import {
  parseAcceleratorToKeys,
  formatKeysToAccelerator,
  validateAccelerator
} from './accelerator';

describe('accelerator round-trip', () => {
  it('round-trips CommandOrControl+Shift+H', () => {
    const combo = parseAcceleratorToKeys('CommandOrControl+Shift+H');
    expect(combo).toEqual({ ctrl: true, meta: true, alt: false, shift: true, key: 'H' });
    expect(formatKeysToAccelerator(combo)).toBe('CommandOrControl+Shift+H');
  });

  it('round-trips a bare F-key', () => {
    const combo = parseAcceleratorToKeys('F5');
    expect(combo).toEqual({ ctrl: false, meta: false, alt: false, shift: false, key: 'F5' });
    expect(formatKeysToAccelerator(combo)).toBe('F5');
  });

  it('round-trips Ctrl+Alt+K', () => {
    const combo = parseAcceleratorToKeys('Ctrl+Alt+K');
    expect(combo).toEqual({ ctrl: true, meta: false, alt: true, shift: false, key: 'K' });
    // format normalizes ctrl-only to CommandOrControl (matches electron convention used in app)
    expect(formatKeysToAccelerator(combo)).toBe('CommandOrControl+Alt+K');
  });

  it('produces a valid accelerator from a parsed combo', () => {
    const accel = formatKeysToAccelerator(parseAcceleratorToKeys('CommandOrControl+Shift+H'));
    expect(validateAccelerator(accel).valid).toBe(true);
  });
});
