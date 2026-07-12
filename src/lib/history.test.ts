import { beforeEach, describe, expect, it } from 'vitest';
import { useHistoryStore } from './history';

beforeEach(() => {
  localStorage.clear();
  useHistoryStore.setState({ entries: {} });
});

describe('history.removeOne', () => {
  it('removes exactly one entry at index and preserves order', () => {
    useHistoryStore.setState({
      entries: {
        t1: [
          { input: 'a', ts: 1 },
          { input: 'b', ts: 2 },
          { input: 'c', ts: 3 }
        ]
      }
    });
    useHistoryStore.getState().removeOne('t1', 1);
    expect(useHistoryStore.getState().getAll('t1')).toEqual([
      { input: 'a', ts: 1 },
      { input: 'c', ts: 3 }
    ]);
  });

  it('out-of-range index is a no-op', () => {
    useHistoryStore.setState({
      entries: { t1: [{ input: 'a', ts: 1 }, { input: 'b', ts: 2 }] }
    });
    useHistoryStore.getState().removeOne('t1', 99);
    useHistoryStore.getState().removeOne('t1', -1);
    expect(useHistoryStore.getState().getAll('t1')).toHaveLength(2);
  });

  it('does not affect other tools', () => {
    useHistoryStore.setState({
      entries: {
        t1: [{ input: 'a', ts: 1 }, { input: 'b', ts: 2 }],
        t2: [{ input: 'x', ts: 9 }]
      }
    });
    useHistoryStore.getState().removeOne('t1', 0);
    expect(useHistoryStore.getState().getAll('t2')).toHaveLength(1);
    expect(useHistoryStore.getState().getAll('t2')).toEqual([
      { input: 'x', ts: 9 }
    ]);
  });

  it('clearAll still scopes to a tool', () => {
    useHistoryStore.setState({
      entries: {
        t1: [{ input: 'a', ts: 1 }],
        t2: [{ input: 'x', ts: 9 }]
      }
    });
    useHistoryStore.getState().clearAll('t1');
    expect(useHistoryStore.getState().getAll('t1')).toEqual([]);
    expect(useHistoryStore.getState().getAll('t2')).toEqual([
      { input: 'x', ts: 9 }
    ]);
  });
});
