import { create } from 'zustand';

const STORAGE_KEY = 'toolsmith:tool-preferences';
const MAX_RECENT_TOOLS = 8;

export interface ToolPreferences {
  readonly pinnedIds: readonly string[];
  readonly recentToolIds: readonly string[];
}

export interface ToolPreferencesState extends ToolPreferences {
  togglePin: (toolId: string) => void;
  recordRecent: (toolId: string) => void;
}

function emptyPreferences(): ToolPreferences {
  return { pinnedIds: [], recentToolIds: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIds(value: unknown, limit?: number): string[] {
  if (!Array.isArray(value)) return [];

  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0 || ids.includes(item)) continue;
    ids.push(item);
    if (limit !== undefined && ids.length === limit) break;
  }
  return ids;
}

export function parseToolPreferences(raw: string | null): ToolPreferences {
  if (raw === null) return emptyPreferences();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyPreferences();

    return {
      pinnedIds: parseIds(parsed.pinnedIds),
      recentToolIds: parseIds(parsed.recentToolIds, MAX_RECENT_TOOLS)
    };
  } catch (error) {
    if (error instanceof SyntaxError) return emptyPreferences();
    throw error;
  }
}

function loadPreferences(): ToolPreferences {
  try {
    return parseToolPreferences(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    if (error instanceof Error) return emptyPreferences();
    throw error;
  }
}

function savePreferences(preferences: ToolPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    if (error instanceof Error) return;
    throw error;
  }
}

export const useToolPreferencesStore = create<ToolPreferencesState>((set) => ({
  ...loadPreferences(),

  togglePin(toolId: string) {
    set((state) => {
      const pinnedIds = state.pinnedIds.includes(toolId)
        ? state.pinnedIds.filter((id) => id !== toolId)
        : [...state.pinnedIds, toolId];
      const next: ToolPreferences = {
        pinnedIds,
        recentToolIds: state.recentToolIds
      };
      savePreferences(next);
      return next;
    });
  },

  recordRecent(toolId: string) {
    set((state) => {
      const recentToolIds = [
        toolId,
        ...state.recentToolIds.filter((id) => id !== toolId)
      ].slice(0, MAX_RECENT_TOOLS);
      const next: ToolPreferences = {
        pinnedIds: state.pinnedIds,
        recentToolIds
      };
      savePreferences(next);
      return next;
    });
  }
}));

export function orderTools<T extends { readonly id: string }>(
  tools: readonly T[],
  pinnedIds: readonly string[],
  recentToolIds: readonly string[]
): T[] {
  const pinned = new Set(pinnedIds);
  const recentRanks = new Map<string, number>();
  for (const id of recentToolIds) {
    if (!recentRanks.has(id)) recentRanks.set(id, recentRanks.size);
  }

  const pinnedTools: T[] = [];
  const recentTools: Array<{ readonly tool: T; readonly rank: number; readonly index: number }> = [];
  const fallbackTools: T[] = [];

  for (const [index, tool] of tools.entries()) {
    if (pinned.has(tool.id)) {
      pinnedTools.push(tool);
      continue;
    }

    const rank = recentRanks.get(tool.id);
    if (rank !== undefined) {
      recentTools.push({ tool, rank, index });
      continue;
    }

    fallbackTools.push(tool);
  }

  recentTools.sort((left, right) => left.rank - right.rank || left.index - right.index);

  return [
    ...pinnedTools,
    ...recentTools.map(({ tool }) => tool),
    ...fallbackTools
  ];
}
