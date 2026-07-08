import { create } from 'zustand';

interface PendingInputState {
  pending: Record<string, string>;
  /** Seed input for a tool — will be consumed once on the tool's next mount. */
  setPendingInput: (toolId: string, value: string) => void;
  /** Read and clear the pending input for a tool. Returns null if none. */
  consumePendingInput: (toolId: string) => string | null;
}

export const usePendingInput = create<PendingInputState>((set, get) => ({
  pending: {},
  setPendingInput: (toolId, value) =>
    set((s) => ({ pending: { ...s.pending, [toolId]: value } })),
  consumePendingInput: (toolId) => {
    const value = get().pending[toolId] ?? null;
    if (value !== null) {
      set((s) => {
        const next = { ...s.pending };
        delete next[toolId];
        return { pending: next };
      });
    }
    return value;
  },
}));
