import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  orderTools,
  parseToolPreferences,
  useToolPreferencesStore
} from './tool-preferences';

const STORAGE_KEY = 'toolsmith:tool-preferences';

type TestTool = {
  readonly id: string;
  readonly label: string;
};

const tools: readonly TestTool[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'bravo', label: 'Bravo' },
  { id: 'charlie', label: 'Charlie' },
  { id: 'delta', label: 'Delta' }
];

beforeEach(() => {
  localStorage.clear();
  useToolPreferencesStore.setState({ pinnedIds: [], recentToolIds: [] });
});

describe('orderTools', () => {
  it('places pinned tools before unpinned recent tools and fallback tools', () => {
    const ordered = orderTools(tools, ['charlie'], ['delta', 'bravo']);

    expect(ordered.map((tool) => tool.id)).toEqual([
      'charlie',
      'delta',
      'bravo',
      'alpha'
    ]);
  });

  it('keeps pinned and fallback ties in original input order', () => {
    const input = [tools[2], tools[0], tools[3], tools[1]];

    const ordered = orderTools(input, ['bravo', 'charlie'], ['missing']);

    expect(ordered.map((tool) => tool.id)).toEqual([
      'charlie',
      'bravo',
      'alpha',
      'delta'
    ]);
  });

  it('does not mutate input or create rows for stale IDs', () => {
    const input = [...tools];

    const ordered = orderTools(input, ['stale', 'bravo'], ['missing', 'alpha']);

    expect(ordered.map((tool) => tool.id)).toEqual([
      'bravo',
      'alpha',
      'charlie',
      'delta'
    ]);
    expect(input).toEqual(tools);
    expect(ordered).not.toBe(input);
  });
});

describe('preference store', () => {
  it('moves duplicate recent selections to the front and caps recents at eight', () => {
    const store = useToolPreferencesStore.getState();

    for (const id of ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']) {
      store.recordRecent(id);
    }
    store.recordRecent('four');

    expect(useToolPreferencesStore.getState().recentToolIds).toEqual([
      'four',
      'nine',
      'eight',
      'seven',
      'six',
      'five',
      'three',
      'two'
    ]);
  });

  it('toggles a pin without changing recent order', () => {
    const store = useToolPreferencesStore.getState();

    store.recordRecent('alpha');
    store.togglePin('bravo');
    store.togglePin('bravo');

    expect(useToolPreferencesStore.getState().pinnedIds).toEqual([]);
    expect(useToolPreferencesStore.getState().recentToolIds).toEqual(['alpha']);
  });

  it('persists preferences and reloads them from localStorage', async () => {
    const store = useToolPreferencesStore.getState();

    store.togglePin('alpha');
    store.recordRecent('bravo');

    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ pinnedIds: ['alpha'], recentToolIds: ['bravo'] })
    );

    vi.resetModules();
    const reloaded = await import('./tool-preferences');

    expect(reloaded.useToolPreferencesStore.getState().pinnedIds).toEqual(['alpha']);
    expect(reloaded.useToolPreferencesStore.getState().recentToolIds).toEqual(['bravo']);
  });
});

describe('parseToolPreferences', () => {
  it('returns empty preferences for malformed JSON and root structures', () => {
    expect(parseToolPreferences('{')).toEqual({ pinnedIds: [], recentToolIds: [] });
    expect(parseToolPreferences(JSON.stringify(['alpha']))).toEqual({
      pinnedIds: [],
      recentToolIds: []
    });
    expect(parseToolPreferences(null)).toEqual({ pinnedIds: [], recentToolIds: [] });
  });

  it('filters malformed entries, deduplicates, and caps parsed recents', () => {
    const raw = JSON.stringify({
      pinnedIds: ['alpha', 4, 'alpha', '', null],
      recentToolIds: [
        'one',
        'two',
        'one',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        false
      ]
    });

    expect(parseToolPreferences(raw)).toEqual({
      pinnedIds: ['alpha'],
      recentToolIds: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
    });
  });

  it('ignores malformed fields independently', () => {
    expect(parseToolPreferences(JSON.stringify({ pinnedIds: 'alpha', recentToolIds: ['bravo'] }))).toEqual({
      pinnedIds: [],
      recentToolIds: ['bravo']
    });
  });
});
