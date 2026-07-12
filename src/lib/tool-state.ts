import { create } from 'zustand';
import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'devutils:tool-state';
/** Guard against a single tool bloating localStorage (quota ~5MB total). */
const MAX_PER_TOOL_BYTES = 50 * 1024;

export type ToolStateBlob = Record<string, unknown>;

export interface ToolStateStore {
  states: Record<string, ToolStateBlob>;
  /** Persist the full state blob for a tool (replaces previous). */
  setAll: (toolId: string, state: ToolStateBlob) => void;
  /** Read the full state blob for a tool, or undefined if none saved. */
  getState: (toolId: string) => ToolStateBlob | undefined;
}

function load(): Record<string, ToolStateBlob> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && 'states' in parsed
      ? (parsed.states as Record<string, ToolStateBlob>)
      : {};
  } catch {
    return {};
  }
}

function save(states: Record<string, ToolStateBlob>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ states }));
  } catch {
    /* storage full or blocked — drop the write, keep app usable */
  }
}

export const useToolStateStore = create<ToolStateStore>((set, get) => ({
  states: load(),

  setAll(toolId, state) {
    // Truncate oversized blobs rather than throwing, so a misbehaving tool
    // can never crash state persistence for every other tool.
    let blob = state;
    const serialized = JSON.stringify(state);
    if (serialized.length > MAX_PER_TOOL_BYTES) {
      blob = { __truncated: true };
    }
    set((s) => {
      const next = { ...s.states, [toolId]: blob };
      setTimeout(() => save(next), 0);
      return { states: next };
    });
  },

  getState(toolId) {
    return get().states[toolId];
  }
}));

/**
 * Per-tool state that survives tool switches WITHOUT keeping the component
 * mounted. Reads saved state (merged over defaults) on mount and persists
 * every change (debounced). Ephemeral state (output, error, computed) should
 * stay in plain `useState` — only persist input + user-selected options here.
 *
 * Note: the persisted blob goes through JSON, so values must be JSON-safe
 * (use `string[]` instead of `Set`, etc.).
 */
export function useToolState<T extends ToolStateBlob = ToolStateBlob>(
  toolId: string,
  defaults: T,
  /** Precedence over defaults+saved (e.g. a one-shot command-palette seed). */
  override?: Partial<T>
): [T, (patch: Partial<T>) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = useToolStateStore.getState().getState(toolId);
    return { ...defaults, ...(saved as Partial<T> | undefined), ...(override as Partial<T> | undefined) };
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always hold the latest committed state so the unmount flush writes the
  // current value, not the stale initial one captured by the effect closure.
  const latest = useRef<T>(state);
  latest.current = state;

  const update = (patch: Partial<T>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        useToolStateStore.getState().setAll(toolId, next);
      }, 300);
      return next;
    });
  };

  // Flush any pending write on unmount so a quick switch never loses the last edit.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      useToolStateStore.getState().setAll(toolId, latest.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  return [state, update];
}
