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
    // both ctrl and meta true → both Control and Command emitted
    expect(formatKeysToAccelerator(combo)).toBe('Control+Command+Shift+H');
  });

  it('round-trips a bare F-key', () => {
    const combo = parseAcceleratorToKeys('F5');
    expect(combo).toEqual({ ctrl: false, meta: false, alt: false, shift: false, key: 'F5' });
    expect(formatKeysToAccelerator(combo)).toBe('F5');
  });

  it('round-trips Ctrl+Alt+K', () => {
    const combo = parseAcceleratorToKeys('Ctrl+Alt+K');
    expect(combo).toEqual({ ctrl: true, meta: false, alt: true, shift: false, key: 'K' });
    // ctrl-only → Control (preserves ctrl/meta distinction)
    expect(formatKeysToAccelerator(combo)).toBe('Control+Alt+K');
  });

  it('produces a valid accelerator from a parsed combo', () => {
    const accel = formatKeysToAccelerator(parseAcceleratorToKeys('CommandOrControl+Shift+H'));
    expect(validateAccelerator(accel).valid).toBe(true);
  });

  it('ctrl-only on Mac produces Control token, not CommandOrControl', () => {
    // Simulates user pressing Ctrl+B on macOS: ctrl=true, meta=false
    const combo: KeyCombo = { ctrl: true, meta: false, alt: false, shift: false, key: 'B' };
    expect(formatKeysToAccelerator(combo)).toBe('Control+B');
    expect(validateAccelerator('Control+B').valid).toBe(true);
  });

  it('meta-only on Mac produces Command token', () => {
    const combo: KeyCombo = { ctrl: false, meta: true, alt: false, shift: false, key: 'B' };
    expect(formatKeysToAccelerator(combo)).toBe('Command+B');
    expect(validateAccelerator('Command+B').valid).toBe(true);
  });
});
