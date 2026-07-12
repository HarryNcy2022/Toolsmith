import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '../history';

describe('history clearAll', () => {
  beforeEach(() => {
    localStorage.clear();
    useHistoryStore.setState({ entries: {} });
  });

  it('clear-tool: clears only the given tool', () => {
    useHistoryStore.getState().push('url-encode', 'a');
    useHistoryStore.getState().push('json-formatter', 'b');
    useHistoryStore.getState().clearAll('url-encode');
    expect(useHistoryStore.getState().getAll('url-encode')).toEqual([]);
    expect(useHistoryStore.getState().getAll('json-formatter').length).toBe(1);
  });

  it('clear-all: clears every tool', () => {
    useHistoryStore.getState().push('url-encode', 'a');
    useHistoryStore.getState().push('json-formatter', 'b');
    useHistoryStore.getState().clearAll();
    expect(useHistoryStore.getState().entries).toEqual({});
  });

  it('clear-persists: cleared state is written to localStorage', () => {
    vi.useFakeTimers();
    useHistoryStore.getState().push('url-encode', 'a');
    useHistoryStore.getState().clearAll('url-encode');
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
    const raw = localStorage.getItem('devutils:history');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toEqual({});
  });
});
