import { create } from 'zustand';

const MAX_PER_TOOL = 10;
const STORAGE_KEY = 'devutils:history';

export interface HistoryEntry {
  input: string;
  ts: number;
}

export interface HistoryState {
  entries: Record<string, HistoryEntry[]>;
  push: (toolId: string, input: string) => void;
  getAll: (toolId: string) => HistoryEntry[];
}

function load(): Record<string, HistoryEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(state: HistoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
  } catch {
    /* storage full or blocked */
  }
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: load(),

  push(toolId: string, input: string) {
    if (!input.trim()) return;
    set((state) => {
      const prev = state.entries[toolId] ?? [];
      // skip duplicate of most recent
      if (prev[0]?.input === input) return state;
      const next: HistoryEntry[] = [
        { input, ts: Date.now() },
        ...prev.slice(0, MAX_PER_TOOL - 1)
      ];
      const entries = { ...state.entries, [toolId]: next };
      // persist after state update
      setTimeout(() => save(get()), 0);
      return { entries };
    });
  },

  getAll(toolId: string) {
    return get().entries[toolId] ?? [];
  }
}));
