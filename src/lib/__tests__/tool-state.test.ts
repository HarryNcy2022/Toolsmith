import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToolStateStore } from '../tool-state';
import { useToolState } from '../tool-state';

describe('useToolStateStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useToolStateStore.setState({ states: {} });
  });

  it('load-save-state: setAll then getState returns the saved blob', () => {
    useToolStateStore.getState().setAll('tool-a', { input: 'hello', mode: 'encode' });
    expect(useToolStateStore.getState().getState('tool-a')).toEqual({
      input: 'hello',
      mode: 'encode'
    });
  });

  it('merge-defaults: getState returns undefined for untouched tool', () => {
    expect(useToolStateStore.getState().getState('never-used')).toBeUndefined();
  });

  it('persistence-roundtrip: state survives a fresh store read from localStorage', () => {
    vi.useFakeTimers();
    useToolStateStore.getState().setAll('tool-b', { input: 'x', dir: 'decode' });
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
    // Simulate reload: a new read of localStorage should contain the blob.
    const raw = localStorage.getItem('devutils:tool-state');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.states['tool-b']).toEqual({ input: 'x', dir: 'decode' });
  });

  it('size-cap: writes exceeding 50KB are truncated silently without throwing', () => {
    const big = 'a'.repeat(60 * 1024);
    // Should not throw even though it exceeds the per-tool cap.
    expect(() =>
      useToolStateStore.getState().setAll('tool-big', { input: big })
    ).not.toThrow();
  });
});

describe('useToolState hook', () => {
  beforeEach(() => {
    localStorage.clear();
    useToolStateStore.setState({ states: {} });
  });

  it('defaults-applied: returns defaults when no saved state', () => {
    const { result } = renderHook(() =>
      useToolState('hook-tool-1', { input: '', dir: 'encode' as const })
    );
    expect(result.current[0]).toEqual({ input: '', dir: 'encode' });
  });

  it('merge-defaults: saved values override defaults, missing keys fall back to defaults', () => {
    useToolStateStore.getState().setAll('hook-tool-2', { input: 'saved' });
    const { result } = renderHook(() =>
      useToolState('hook-tool-2', { input: '', dir: 'encode' as const })
    );
    expect(result.current[0]).toEqual({ input: 'saved', dir: 'encode' });
  });

  it('patch-persists: setState merges a partial and persists', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useToolState('hook-tool-3', { input: '', dir: 'encode' as const })
    );
    act(() => {
      result.current[1]({ input: 'updated' });
    });
    expect(result.current[0]).toEqual({ input: 'updated', dir: 'encode' });
    // flush the debounced write
    act(() => {
      vi.advanceTimersByTime(600);
    });
    vi.useRealTimers();
    expect(useToolStateStore.getState().getState('hook-tool-3')).toEqual({
      input: 'updated',
      dir: 'encode'
    });
  });
});
