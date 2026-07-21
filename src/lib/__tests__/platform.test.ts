import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  MAC_MODIFIER_SYMBOLS,
  WIN_MODIFIER_LABELS,
  PLATFORM_KEY_MAP,
} from '../platform';

describe('MAC_MODIFIER_SYMBOLS', () => {
  it('has expected mac symbols', () => {
    expect(MAC_MODIFIER_SYMBOLS.meta).toBe('\u2318');
    expect(MAC_MODIFIER_SYMBOLS.ctrl).toBe('\u2303');
    expect(MAC_MODIFIER_SYMBOLS.alt).toBe('\u2325');
    expect(MAC_MODIFIER_SYMBOLS.shift).toBe('\u21E7');
  });
});

describe('WIN_MODIFIER_LABELS', () => {
  it('has expected win labels', () => {
    expect(WIN_MODIFIER_LABELS.ctrl).toBe('Ctrl');
    expect(WIN_MODIFIER_LABELS.alt).toBe('Alt');
    expect(WIN_MODIFIER_LABELS.shift).toBe('Shift');
  });
});

describe('PLATFORM_KEY_MAP', () => {
  it('maps mac to symbols, others to labels', () => {
    expect(PLATFORM_KEY_MAP.mac).toBe(MAC_MODIFIER_SYMBOLS);
    expect(PLATFORM_KEY_MAP.win).toBe(WIN_MODIFIER_LABELS);
    expect(PLATFORM_KEY_MAP.linux).toBe(WIN_MODIFIER_LABELS);
    expect(PLATFORM_KEY_MAP.unknown).toBe(WIN_MODIFIER_LABELS);
  });
});

describe('detectPlatform', () => {
  it('does not throw', () => {
    expect(() => detectPlatform()).not.toThrow();
  });

  it('returns win when navigator.platform is Win32', () => {
    expect(detectPlatform()).toBe('win');
  });
});
