import { create } from 'zustand';
import type { SearchSource } from '../types';

export interface SearchMatch {
  sourceId: string;
  toolId: string;
  label: string;
  matchText: string;
  startIndex: number;
  matchLength: number;
  contextBefore: string;
  contextAfter: string;
}

interface ToolSearchState {
  isOpen: boolean;
  query: string;
  matches: SearchMatch[];
  activeIndex: number;

  sources: Record<string, SearchSource>;
  registerSource: (source: SearchSource) => void;
  unregisterSource: (id: string) => void;

  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  search: (toolId: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  goToMatch: (index: number) => void;
}

export const useToolSearch = create<ToolSearchState>((set, get) => ({
  isOpen: false,
  query: '',
  matches: [],
  activeIndex: 0,

  sources: {},

  registerSource: (source) =>
    set((s) => ({ sources: { ...s.sources, [source.id]: source } })),

  unregisterSource: (id) =>
    set((s) => {
      const next = { ...s.sources };
      delete next[id];
      return { sources: next };
    }),

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false, query: '', matches: [], activeIndex: 0 }),

  setQuery: (q) => set({ query: q }),

  search: (toolId) => {
    const { query, sources } = get();
    if (query.length < 1) {
      set({ matches: [], activeIndex: 0 });
      return;
    }

    const lowerQ = query.toLowerCase();
    const matches: SearchMatch[] = [];

    for (const source of Object.values(sources)) {
      if (source.toolId !== toolId) continue;

      const content = source.getContent();
      const lower = content.toLowerCase();
      let idx = lower.indexOf(lowerQ);

      while (idx !== -1) {
        matches.push({
          sourceId: source.id,
          toolId: source.toolId,
          label: source.label,
          matchText: content.slice(idx, idx + query.length),
          startIndex: idx,
          matchLength: query.length,
          contextBefore: content.slice(Math.max(0, idx - 50), idx),
          contextAfter: content.slice(
            idx + query.length,
            idx + query.length + 50,
          ),
        });
        idx = lower.indexOf(lowerQ, idx + 1);
      }
    }

    matches.sort((a, b) => {
      if (a.sourceId < b.sourceId) return -1;
      if (a.sourceId > b.sourceId) return 1;
      return a.startIndex - b.startIndex;
    });

    set({ matches, activeIndex: 0 });
  },

  nextMatch: () => {
    const { matches, activeIndex, sources } = get();
    if (matches.length === 0) return;
    const nextIdx = (activeIndex + 1) % matches.length;
    set({ activeIndex: nextIdx });
    const match = matches[nextIdx];
    const source = match ? sources[match.sourceId] : undefined;
    source?.scrollToMatch?.(match.startIndex, match.matchLength);
  },

  prevMatch: () => {
    const { matches, activeIndex, sources } = get();
    if (matches.length === 0) return;
    const prevIdx = (activeIndex - 1 + matches.length) % matches.length;
    set({ activeIndex: prevIdx });
    const match = matches[prevIdx];
    const source = match ? sources[match.sourceId] : undefined;
    source?.scrollToMatch?.(match.startIndex, match.matchLength);
  },

  goToMatch: (index) => {
    const { matches, sources } = get();
    const match = matches[index];
    if (!match) return;
    set({ activeIndex: index });
    const source = sources[match.sourceId];
    source?.scrollToMatch?.(match.startIndex, match.matchLength);
  },
}));
