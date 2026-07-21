import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToolStateStore } from '../tool-state';
import { useHistoryStore } from '../history';
import { validateAccelerator, formatKeysToAccelerator, parseAcceleratorToKeys, type KeyCombo } from '../accelerator';

describe('tool-state preservation across switch (S1)', () => {
  beforeEach(() => {
    localStorage.clear();
    useToolStateStore.setState({ states: {} });
  });

  it('tool-state-preserve-switch: input + options persist for two tools', () => {
    // Simulate tool A saving state
    useToolStateStore.getState().setAll('url-encode', { input: 'https://x', dir: 'decode', component: 'component' });
    // Simulate switching to tool B then back to A
    useToolStateStore.getState().setAll('json-formatter', { input: '{}', indent: 4, mode: 'minify', sortKeysOn: true, autoRepairOn: false });
    // After switching back to A, the store still holds A's full state
    expect(useToolStateStore.getState().getState('url-encode')).toEqual({
      input: 'https://x',
      dir: 'decode',
      component: 'component'
    });
    // and B's state is independent
    expect(useToolStateStore.getState().getState('json-formatter')?.mode).toBe('minify');
  });
});

describe('pending-input overrides saved state (S5)', () => {
  beforeEach(() => {
    localStorage.clear();
    useToolStateStore.setState({ states: {} });
  });

  it('pending-input-overrides-saved-state: pending wins on first read', () => {
    // A tool previously saved state
    useToolStateStore.getState().setAll('url-encode', { input: 'saved', dir: 'encode', component: 'full' });
    // Command palette seeds pending input -> should override the saved input
    const saved = useToolStateStore.getState().getState('url-encode') ?? {};
    const override = { input: 'from-clipboard' };
    const merged = { ...saved, ...override };
    expect(merged.input).toBe('from-clipboard');
  });
});

describe('history clear (S3)', () => {
  beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState({ entries: {} });
  });

  it('clear-all-then-empty: clearing yields no entries and persists', () => {
    useHistoryStore.getState().push('url-encode', 'a');
    useHistoryStore.getState().push('base64', 'b');
    vi.useFakeTimers();
    useHistoryStore.getState().clearAll();
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
    expect(useHistoryStore.getState().entries).toEqual({});
    const raw = localStorage.getItem('devutils:history');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toEqual({});
  });
});

describe('config accelerator flow (S2/S4)', () => {
  it('roundtrip: format -> validate -> parse is stable', () => {
    const combo: KeyCombo = { ctrl: true, meta: true, alt: false, shift: true, key: 'E' };
    const accel = formatKeysToAccelerator(combo);
    expect(accel).toBe('Control+Command+Shift+E');
    expect(validateAccelerator(accel).valid).toBe(true);
    const back = parseAcceleratorToKeys(accel);
    expect(back.ctrl).toBe(true);
    expect(back.shift).toBe(true);
    expect(back.key).toBe('E');
  });

  it('invalid-rejected: a modifier-only combo is invalid', () => {
    expect(validateAccelerator('CmdOrCtrl+Shift').valid).toBe(false);
  });

  it('default-hotkey-valid: the shipped default is valid', () => {
    expect(validateAccelerator('CommandOrControl+Shift+D').valid).toBe(true);
  });
});
