import type { Tool, ToolCategory, ToolModule } from '../types';

// tools registered here in import order. Sidebar groups by category, sorts by name.
const modules: ToolModule[] = [];

export function registerTool(mod: ToolModule): void {
  modules.push(mod);
}

export function getTools(): Tool[] {
  return modules.map((m) => ({ ...m.meta, component: m.component }));
}

export function groupByCategory(tools: Tool[]): Record<ToolCategory, Tool[]> {
  const grouped = {} as Record<ToolCategory, Tool[]>;
  for (const t of tools) {
    (grouped[t.category] ??= []).push(t);
  }
  for (const cat of Object.keys(grouped) as ToolCategory[]) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

export function findTool(id: string): Tool | undefined {
  return getTools().find((t) => t.id === id);
}
